const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const Order = require("../models/Order");
const User = require("../models/User");
const { generateInvoicePdf, getInvoicesByDateRange } = require("../services/invoiceService");
const { sendInvoiceEmail } = require("../services/emailService");

function validateCard({ cardNumber, expiryMonth, expiryYear, cvv, cardHolder }) {
  if (!/^\d{16}$/.test(cardNumber || "")) return false;
  if (!/^\d{3}$/.test(cvv || "")) return false;

  const month = parseInt(expiryMonth, 10);
  if (Number.isNaN(month) || month < 1 || month > 12) return false;

  const year = parseInt(expiryYear, 10);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (Number.isNaN(year) || year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  if (!/^[A-Za-z ]+$/.test(cardHolder || "")) return false;

  return true;
}
function requireSalesManager(req, res, next) {
  if (!req.user || req.user.role !== "sales_manager") {
    return res
      .status(403)
      .json({ message: "Only sales managers can view invoices" });
  }
  next();
}

router.post("/checkout", auth, async (req, res) => {
  try {
    const { cardNumber, expiryMonth, expiryYear, cvv, cardHolder, amount, orderId } = req.body;

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

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (String(order.userId) !== req.user.id) {
      return res.status(403).json({ message: "You cannot pay for this order" });
    }

    if (order.status === "paid") {
      return res.status(409).json({ message: "Order is already paid", orderId: order.id });
    }

    if (!validateCard({ cardNumber, expiryMonth, expiryYear, cvv, cardHolder })) {
      return res.status(400).json({ message: "Invalid credit card information" });
    }

    if (Math.abs(order.total - numericAmount) > 0.01) {
      return res.status(400).json({
        message: "Payment amount does not match order total",
        expected: order.total,
        received: numericAmount,
      });
    }

    const user = await User.findById(order.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found for this order" });
    }

    order.status = "paid";
    order.paidAt = new Date();
    order.invoiceNumber = order.invoiceNumber || `INV-${String(order.id).slice(-6).toUpperCase()}`;
    await order.save();

    const { buffer: invoicePdf, invoiceNumber } = await generateInvoicePdf({ order, user });
    const invoiceFileName = `${invoiceNumber}.pdf`;

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
      console.error("[email] Failed to send invoice:", emailErr);
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
  } catch (error) {
    console.error("checkout error:", error);
    return res.status(500).json({ message: "Failed to process payment" });
  }
});

router.get("/invoices", auth, requireSalesManager, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const invoices = await getInvoicesByDateRange(startDate, endDate);

    return res.status(200).json({
      message: "Invoices fetched successfully",
      filters: { startDate, endDate },
      invoices,
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return res.status(500).json({ message: "Failed to fetch invoices" });
  }
});

module.exports = router;
