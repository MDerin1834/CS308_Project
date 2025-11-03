const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getCart,
  addOrUpdateItem,
  removeItem,
  mergeGuestCart,
} = require("../controllers/cartController");

router.use(auth);

router.get("/", getCart);
router.post("/", addOrUpdateItem);         // { productId, quantity }
router.delete("/:productId", removeItem);
router.post("/merge", mergeGuestCart);     // { items: [{productId, quantity}] }

module.exports = router;
