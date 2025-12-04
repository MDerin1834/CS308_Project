const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");
const auth = require("../middleware/auth");
const authorizeRole = require("../middleware/authorizeRole");

// PATCH /api/delivery/:id  (product manager only)
router.patch("/:id", auth, authorizeRole("product_manager"), orderController.markDelivered);

module.exports = router;
