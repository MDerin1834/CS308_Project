const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const orderController = require("../controllers/orderController");

// POST /api/orders
// Sepetten yeni sipariş oluşturur
router.post("/", auth, orderController.createOrder);

// GET /api/orders/my-orders
router.get("/my-orders", auth, orderController.getMyOrders);

// PATCH /api/orders/:id/cancel
router.patch("/:id/cancel", auth, orderController.cancelOrder);

// PATCH /api/orders/:id/status   (product manager)
router.patch("/:id/status", auth, orderController.updateOrderStatus);

module.exports = router;
