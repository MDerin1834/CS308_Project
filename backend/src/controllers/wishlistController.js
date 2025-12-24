const wishlistService = require("../services/wishlistService");
const { notifyUserForWishlistDiscounts } = require("../services/wishlistNotificationService");
const logger = require("../config/logger");

exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await wishlistService.getWishlist(userId);

    return res.status(200).json({
      message: "Wishlist fetched successfully",
      items,
    });
  } catch (err) {
    logger.error("Wishlist fetch error", { error: err });
    return res.status(500).json({ message: "Failed to fetch wishlist" });
  }
};

exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    const wishlist = await wishlistService.addToWishlist(userId, productId);

    return res.status(200).json({
      message: "Product added to wishlist",
      wishlist,
    });
  } catch (err) {
    logger.error("Add to wishlist error", { error: err });

    if (err.code === "NOT_FOUND") {
      return res.status(404).json({ message: "Product not found" });
    }

    if (err.code === "ALREADY_EXISTS") {
      return res
        .status(409)
        .json({ message: "Product is already in wishlist" });
    }

    return res.status(500).json({ message: "Failed to add to wishlist" });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const wishlist = await wishlistService.removeFromWishlist(userId, productId);

    return res.status(200).json({
      message: "Removed from wishlist",
      wishlist,
    });
  } catch (err) {
    logger.error("Remove wishlist error", { error: err });

    if (err.code === "NOT_FOUND") {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    return res.status(500).json({ message: "Failed to remove from wishlist" });
  }
};

exports.getDiscountNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await wishlistService.findDiscountedWishlistItems(userId);

    return res.status(200).json({
      message: "Discount notifications fetched",
      count: items.length,
      items,
    });
  } catch (err) {
    logger.error("Wishlist discount fetch error", { error: err });
    return res.status(500).json({ message: "Failed to fetch discount notifications" });
  }
};

exports.notifyDiscounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await notifyUserForWishlistDiscounts(userId);

    if (!result.sent) {
      return res.status(200).json({
        message: "No discounted items in wishlist at the moment",
        sent: false,
      });
    }

    return res.status(200).json({
      message: "Discount email sent successfully",
      sent: true,
      count: result.count,
    });
  } catch (err) {
    logger.error("Wishlist discount notify error", { error: err });

    if (err.code === "NO_EMAIL") {
      return res.status(400).json({
        message: "User does not have a valid email address",
      });
    }

    return res.status(500).json({ message: "Failed to send discount email" });
  }
};

exports.clearDiscountNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const wishlist = await wishlistService.getOrCreateWishlist(userId);
    wishlist.discountDismissedAt = new Date();
    await wishlist.save();

    return res.status(200).json({
      message: "Discount notifications cleared",
      clearedAt: wishlist.discountDismissedAt,
    });
  } catch (err) {
    logger.error("Wishlist discount clear error", { error: err });
    return res.status(500).json({ message: "Failed to clear discount notifications" });
  }
};
