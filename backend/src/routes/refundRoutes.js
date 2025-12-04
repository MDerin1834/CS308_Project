const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const authorizeRole = require("../middleware/authorizeRole");
const Order = require("../models/Order");
const Product = require("../models/Product");
const logger = require("../config/logger");

/**
 * POST /api/refunds
 * Body: { orderId, reason? }
 * Customer can request a refund for their delivered order.
 */
router.post("/", auth, async (req, res) => {
  try {
    const { orderId, reason } = req.body;
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

    if (order.refundRequestedAt) {
      return res.status(409).json({ message: "Refund already requested for this order" });
    }

    order.refundRequestedAt = new Date();
    order.refundRequestReason = reason || "";
    order.refundRequestStatus = "pending";
    await order.save();

    return res.status(200).json({
      message: "Refund request submitted",
      orderId: order.id,
      refundRequestStatus: order.refundRequestStatus,
    });
  } catch (err) {
    logger.error("Refund request error", { error: err });
    return res.status(500).json({ message: "Failed to submit refund request" });
  }
});

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

async function restockProducts(order) {
  if (!Array.isArray(order.items)) return;

  const ids = order.items.map((it) => it.productId);
  const products = await Product.find({ id: { $in: ids } });
  const map = new Map(products.map((p) => [p.id, p]));

  for (const item of order.items) {
    const product = map.get(item.productId);
    if (!product) continue;
    product.stock = (product.stock || 0) + (item.quantity || 0);
    await product.save();
  }
}

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

    await restockProducts(order);

    order.refundRequestStatus = "approved";
    order.refundedAt = new Date();
    order.refundAmount = order.total;
    order.refundReason = order.refundRequestReason || "";
    order.status = "cancelled";
    await order.save();

    return res.status(200).json({
      message: "Refund approved",
      orderId: order.id,
      refundAmount: order.refundAmount,
      refundRequestStatus: order.refundRequestStatus,
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
