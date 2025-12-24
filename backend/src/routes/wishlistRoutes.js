const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const wishlistController = require("../controllers/wishlistController");

router.get("/", auth, wishlistController.getWishlist);

router.post("/", auth, wishlistController.addToWishlist);

router.delete("/:productId", auth, wishlistController.removeFromWishlist);

router.post(
  "/notify-discounts",
  auth,
  wishlistController.notifyDiscounts
);

router.get(
  "/discounts",
  auth,
  wishlistController.getDiscountNotifications
);

module.exports = router;
