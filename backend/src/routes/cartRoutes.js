const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const cartController = require("../controllers/cartController");

// CRUD for authenticated user cart
router.get("/", auth, cartController.getCart);
router.post("/", auth, cartController.addOrUpdateItem);
router.delete("/:productId", auth, cartController.removeItem);

// Backlog 22: merge guest cart into authenticated cart
router.post("/merge", auth, cartController.mergeGuestCart);

module.exports = router;
