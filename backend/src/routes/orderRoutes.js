const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");
const auth = require("../middleware/auth");
const authorizeRole = require("../middleware/authorizeRole");

// POST /api/orders
// Sepetten yeni sipariş oluşturur
router.post("/", auth, orderController.createOrder);

// GET /api/orders/my-orders
router.get("/my-orders", auth, orderController.getMyOrders);

// GET /api/orders/deliveries (product manager)
router.get("/deliveries", auth, authorizeRole("product_manager"), orderController.getDeliveryList);

// PATCH /api/orders/:id/cancel
router.patch("/:id/cancel", auth, orderController.cancelOrder);

// PATCH /api/orders/:id/status   (product manager)
router.patch("/:id/status", auth, authorizeRole("product_manager"), orderController.updateOrderStatus);

module.exports = router;
