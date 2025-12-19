const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const authorizeRole = require("../middleware/authorizeRole");
const Order = require("../models/Order");
const User = require("../models/User");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const {
  generateInvoicePdf,
  getInvoicesByDateRange,
} = require("../services/invoiceService");

const { sendInvoiceEmail, sendRefundEmail } = require("../services/emailService");
const logger = require("../config/logger");

async function deleteUnpaidOrder(order, userId) {
  if (!order || order.paidAt) return;
  if (String(order.userId) !== String(userId)) return;

  try {
    await order.deleteOne();
  } catch (cleanupErr) {
    logger.error("Failed to delete unpaid order after payment failure", {
      error: cleanupErr,
      orderId: order.id,
    });
  }
}

function validateCard({ cardNumber, expiryMonth, expiryYear, cvv, cardHolder }) {
  if (!/^\d{16}$/.test(cardNumber || "")) return false;
  if (!/^\d{3}$/.test(cvv || "")) return false;

  const month = parseInt(expiryMonth, 10);
  if (!month || month < 1 || month > 12) return false;

  const year = parseInt(expiryYear, 10);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (!year || year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  if (!/^[A-Za-z ]+$/.test(cardHolder || "")) return false;

  return true;
}

router.post("/checkout", auth, async (req, res) => {
  let order;

  try {
    const failPayment = async (status, payload) => {
      await deleteUnpaidOrder(order, req.user.id);
      return res.status(status).json(payload);
    };

    const {
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv,
      cardHolder,
      amount,
      orderId,
    } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Missing orderId for payment" });
    }

    if (!cardNumber || !expiryMonth || !expiryYear || !cvv || !cardHolder || amount === undefined) {
      return res.status(400).json({ message: "Missing required payment fields" });
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount)) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (String(order.userId) !== req.user.id) {
      return res.status(403).json({ message: "You cannot pay for this order" });
    }

    if (order.paidAt) {
      return res.status(409).json({ message: "Order is already paid", orderId: order.id });
    }

    if (!validateCard({ cardNumber, expiryMonth, expiryYear, cvv, cardHolder })) {
      return failPayment(400, { message: "Invalid credit card information" });
    }

    if (Math.abs(order.total - numericAmount) > 0.01) {
      return failPayment(400, {
        message: "Payment amount does not match order total",
        expected: order.total,
        received: numericAmount,
      });
    }

    // Re-check stock at payment time and decrement
    const productIds = (order.items || []).map((it) => it.productId);
    const products = await Product.find({ id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of order.items || []) {
      const product = productMap.get(item.productId);
      const availableStock = product?.stock ?? 0;
      if (!product) {
        return failPayment(404, {
          message: "One of the products in the order no longer exists",
          productId: item.productId,
        });
      }
      if (availableStock < item.quantity) {
        return failPayment(409, {
          message: "Insufficient stock for some items",
          productId: item.productId,
          available: availableStock,
        });
      }
    }

    const user = await User.findById(order.userId);
    if (!user) {
      return failPayment(404, { message: "User not found for this order" });
    }

    for (const item of order.items || []) {
      const product = productMap.get(item.productId);
      product.stock = (product.stock ?? 0) - item.quantity;
      if (product.stock < 0) product.stock = 0;
    }
    await Promise.all(products.map((p) => p.save()));

    order.paidAt = new Date();
    order.invoiceNumber =
      order.invoiceNumber || `INV-${String(order.id).slice(-6).toUpperCase()}`;
    await order.save();

    const { buffer: invoicePdf, invoiceNumber } = await generateInvoicePdf({
      order,
      user,
    });

    const invoiceFileName = `${invoiceNumber}.pdf`;

    // Backlog 46: email the generated invoice to the customer after checkout
    let emailStatus = { skipped: true };
    try {
      emailStatus = await sendInvoiceEmail({
        to: user.email,
        subject: `Your invoice ${invoiceNumber}`,
        text: `Hi ${user.username || "customer"}, thanks for your payment. Your invoice is attached.`,
        pdfBuffer: invoicePdf,
        fileName: invoiceFileName,
      });
    } catch (emailErr) {
      logger.error("email sending failed", { error: emailErr });
    }

    try {
      // Clear the user's cart only after successful payment
      await Cart.findOneAndUpdate({ userId: req.user.id }, { $set: { items: [] } });
    } catch (cartErr) {
      logger.error("Failed to clear cart after payment", { error: cartErr });
    }

    return res.status(200).json({
      message: "Payment successful",
      transactionId: `TXN-${Date.now()}`,
      orderId: order.id,
      amount: order.total,
      invoiceNumber,
      invoiceFileName,
      invoicePdfBase64: invoicePdf.toString("base64"),
      emailSent: !emailStatus.skipped,
    });
  } catch (err) {
    logger.error("checkout error", { error: err });
    await deleteUnpaidOrder(order, req.user?.id);
    return res.status(500).json({ message: "Failed to process payment" });
  }
});

router.get("/invoices", auth, authorizeRole("sales_manager", "product_manager"), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Backlog 51: sales/product managers can list invoices by date range
    const invoices = await getInvoicesByDateRange(startDate, endDate);

    return res.status(200).json({
      message: "Invoices fetched successfully",
      filters: { startDate, endDate },
      invoices,
    });
  } catch (err) {
    logger.error("Error fetching invoices:", { error: err });
    return res.status(500).json({ message: "Failed to fetch invoices" });
  }
});

router.get("/invoices/:id/pdf", auth, authorizeRole("sales_manager", "product_manager"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (!order.paidAt) {
      return res.status(400).json({ message: "Invoice available only for paid orders" });
    }

    const user = await User.findById(order.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found for this order" });
    }

    if (!order.invoiceNumber) {
      order.invoiceNumber = `INV-${String(order.id).slice(-6).toUpperCase()}`;
      await order.save();
    }

    const { buffer: invoicePdf, invoiceNumber } = await generateInvoicePdf({
      order,
      user,
    });

    const filename = `${invoiceNumber}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
    res.setHeader("Content-Length", invoicePdf.length);

    return res.send(invoicePdf);
  } catch (err) {
    logger.error("Error exporting invoice PDF", { error: err, orderId: req.params.id });
    return res.status(500).json({ message: "Failed to export invoice" });
  }
});

router.get("/revenue", auth, authorizeRole("sales_manager"), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {
      paidAt: { $ne: null },
    };

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filter.paidAt.$gte = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.paidAt.$lte = end;
    }

    const orders = await Order.find(filter).lean();

    const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    const costPercentage = 0.5;
    const cost = orders.reduce((sum, order) => {
      const orderCost = (order.items || []).reduce((itemSum, item) => {
        const qty = Number(item?.quantity ?? 0);
        const unitCost = Number(item?.unitCost);
        if (Number.isFinite(unitCost) && unitCost >= 0) {
          return itemSum + unitCost * qty;
        }
        const lineTotal = Number(item?.lineTotal ?? item?.unitPrice * qty ?? 0);
        return itemSum + lineTotal * costPercentage;
      }, 0);
      return sum + orderCost;
    }, 0);

    const profit = revenue - cost;

    return res.status(200).json({
      message: "Revenue and profit calculated successfully",
      filters: { startDate, endDate },
      revenue,
      cost,
      profit,
      costPercentage,
      ordersCount: orders.length,
    });
  } catch (err) {
    logger.error("Revenue error:", { error: err });
    return res.status(500).json({ message: "Failed to calculate revenue" });
  }
});

router.post("/refund", auth, authorizeRole("sales_manager"), async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: "Missing orderId for refund" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!order.paidAt) {
      return res.status(400).json({ message: "Only paid orders can be refunded" });
    }

    const user = await User.findById(order.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found for this order" });
    }

    order.status = "cancelled";
    order.refundedAt = new Date();
    order.refundAmount = order.total;
    order.refundReason = reason || "";
    await order.save();

    let emailStatus = { skipped: true };
    try {
      emailStatus = await sendRefundEmail({
        to: user.email,
        username: user.username,
        orderId: order.id,
        amount: order.total,
        reason,
      });
    } catch (emailErr) {
      logger.error("refund email failed", { error: emailErr });
    }

    return res.status(200).json({
      message: "Refund processed successfully",
      orderId: order.id,
      refundAmount: order.total,
      refundedAt: order.refundedAt,
      emailSent: !emailStatus.skipped,
    });
  } catch (err) {
    logger.error("refund error", { error: err });
    return res.status(500).json({ message: "Failed to process refund" });
  }
});

module.exports = router;
