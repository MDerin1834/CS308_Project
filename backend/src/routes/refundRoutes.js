const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const authorizeRole = require("../middleware/authorizeRole");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const logger = require("../config/logger");
const { sendRefundEmail } = require("../services/emailService");

// Backlog 52: customers submit refund requests for delivered orders
/**
 * POST /api/refunds
 * Body: { orderId, reason? }
 * Customer can request a refund for their delivered order.
 */
router.post("/", auth, async (req, res) => {
  try {
    const { orderId, reason, items } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (String(order.userId) !== req.user.id) {
      return res.status(403).json({ message: "You cannot request a refund for this order" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({ message: "Refunds are only available for delivered orders" });
    }

    const purchasedAt = order.paidAt || order.createdAt;
    if (!purchasedAt) {
      return res.status(400).json({ message: "Order purchase date is missing" });
    }

    const now = new Date();
    const maxWindowMs = 30 * 24 * 60 * 60 * 1000;
    if (now.getTime() - new Date(purchasedAt).getTime() > maxWindowMs) {
      return res.status(400).json({ message: "Refund window has expired (30 days)" });
    }

    if (order.refundRequestedAt) {
      return res.status(409).json({ message: "Refund already requested for this order" });
    }

    const requestedItems = Array.isArray(items) ? items : [];
    const orderItems = Array.isArray(order.items) ? order.items : [];
    const normalizedItems = [];
    let refundRequestAmount = 0;

    if (requestedItems.length === 0) {
      for (const item of orderItems) {
        const qty = Number(item.quantity ?? 0);
        const lineTotal = Number(item.lineTotal ?? item.unitPrice * qty ?? 0);
        normalizedItems.push({
          productId: item.productId,
          name: item.name || "",
          quantity: qty,
          unitPrice: Number(item.unitPrice ?? 0),
          lineTotal,
        });
        refundRequestAmount += lineTotal;
      }
    } else {
      const itemMap = new Map(orderItems.map((it) => [it.productId, it]));
      for (const requested of requestedItems) {
        const orderItem = itemMap.get(requested.productId);
        if (!orderItem) {
          return res.status(400).json({ message: "Invalid refund item selection" });
        }
        const qty = Number(requested.quantity ?? 0);
        if (!Number.isFinite(qty) || qty <= 0 || qty > orderItem.quantity) {
          return res.status(400).json({ message: "Invalid refund quantity" });
        }
        const unitPrice = Number(orderItem.unitPrice ?? 0);
        const lineTotal = Number((unitPrice * qty).toFixed(2));
        normalizedItems.push({
          productId: orderItem.productId,
          name: orderItem.name || "",
          quantity: qty,
          unitPrice,
          lineTotal,
        });
        refundRequestAmount += lineTotal;
      }
    }

    order.refundRequestedAt = new Date();
    order.refundRequestReason = reason || "";
    order.refundRequestStatus = "pending";
    order.refundRequestedItems = normalizedItems;
    order.refundRequestAmount = Number(refundRequestAmount.toFixed(2));
    await order.save();

    return res.status(200).json({
      message: "Refund request submitted",
      orderId: order.id,
      refundRequestStatus: order.refundRequestStatus,
      refundRequestAmount: order.refundRequestAmount,
    });
  } catch (err) {
    logger.error("Refund request error", { error: err });
    return res.status(500).json({ message: "Failed to submit refund request" });
  }
});

// Backlog 53: sales manager reviews pending refund queue
/**
 * GET /api/refunds/pending
 * List pending refund requests (sales_manager only)
 */
router.get("/pending", auth, authorizeRole("sales_manager"), async (_req, res) => {
  try {
    const orders = await Order.find({
      refundRequestStatus: "pending",
      refundRequestedAt: { $ne: null },
    })
      .sort({ refundRequestedAt: -1 })
      .lean();

    return res.status(200).json({ items: orders });
  } catch (err) {
    logger.error("Refund pending list error", { error: err });
    return res.status(500).json({ message: "Failed to fetch refund queue" });
  }
});

async function restockProducts(items) {
  if (!Array.isArray(items)) return;

  const ids = items.map((it) => it.productId);
  const products = await Product.find({ id: { $in: ids } });
  const map = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    const product = map.get(item.productId);
    if (!product) continue;
    product.stock = (product.stock || 0) + (item.quantity || 0);
    await product.save();
  }
}

// Backlog 54: sales manager approval flow (restock + email)
/**
 * PATCH /api/refunds/:id/approve
 */
router.patch("/:id/approve", auth, authorizeRole("sales_manager"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.refundRequestStatus !== "pending") {
      return res.status(409).json({ message: "Refund request is already resolved" });
    }

    const refundItems =
      Array.isArray(order.refundRequestedItems) && order.refundRequestedItems.length > 0
        ? order.refundRequestedItems
        : order.items || [];

    await restockProducts(refundItems);

    const user = await User.findById(order.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found for this order" });
    }

    const requestAmount = Number(order.refundRequestAmount ?? 0);
    const fallbackAmount = (order.items || []).reduce(
      (sum, item) => sum + Number(item.lineTotal ?? item.unitPrice * item.quantity ?? 0),
      0
    );
    const refundAmount = requestAmount || fallbackAmount;

    order.refundRequestStatus = "approved";
    order.refundedAt = new Date();
    order.refundAmount = Number(refundAmount.toFixed(2));
    order.refundReason = order.refundRequestReason || "";
    const isFullRefund =
      refundItems.length === (order.items || []).length &&
      refundItems.every((item) => {
        const original = (order.items || []).find((it) => it.productId === item.productId);
        return original && Number(item.quantity) === Number(original.quantity);
      });
    if (isFullRefund) {
      order.status = "cancelled";
    }
    await order.save();

    let emailStatus = { skipped: true };
    try {
      emailStatus = await sendRefundEmail({
        to: user.email,
        username: user.username,
        orderId: order.id,
        amount: order.refundAmount,
        reason: order.refundReason,
      });
    } catch (emailErr) {
      logger.error("Refund approval email failed", { error: emailErr, orderId: order.id });
    }

    return res.status(200).json({
      message: "Refund approved",
      orderId: order.id,
      refundAmount: order.refundAmount,
      refundRequestStatus: order.refundRequestStatus,
      emailSent: !emailStatus.skipped,
    });
  } catch (err) {
    logger.error("Refund approve error", { error: err, orderId: req.params.id });
    return res.status(500).json({ message: "Failed to approve refund" });
  }
});

/**
 * PATCH /api/refunds/:id/reject
 */
router.patch("/:id/reject", auth, authorizeRole("sales_manager"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.refundRequestStatus !== "pending") {
      return res.status(409).json({ message: "Refund request is already resolved" });
    }

    order.refundRequestStatus = "declined";
    await order.save();

    return res.status(200).json({
      message: "Refund rejected",
      orderId: order.id,
      refundRequestStatus: order.refundRequestStatus,
    });
  } catch (err) {
    logger.error("Refund reject error", { error: err, orderId: req.params.id });
    return res.status(500).json({ message: "Failed to reject refund" });
  }
});

module.exports = router;
