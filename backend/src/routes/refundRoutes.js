const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const Order = require("../models/Order");
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

module.exports = router;
