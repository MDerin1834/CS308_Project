const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const orderController = require("../controllers/orderController");

// PATCH /api/delivery/:id  (product manager only)
router.patch("/:id", auth, orderController.markDelivered);

module.exports = router;
