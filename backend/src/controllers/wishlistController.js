const wishlistService = require("../services/wishlistService");

exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await wishlistService.getWishlist(userId);

    return res.status(200).json({
      message: "Wishlist fetched successfully",
      items,
    });
  } catch (err) {
    console.error("Wishlist fetch error:", err);
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
    console.error("Add to wishlist error:", err);

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

    const wishlist = await wishlistService.removeFromWishlist(
      userId,
      productId
    );

    return res.status(200).json({
      message: "Removed from wishlist",
      wishlist,
    });
  } catch (err) {
    console.error("Remove wishlist error:", err);

    if (err.code === "NOT_FOUND") {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    return res.status(500).json({ message: "Failed to remove from wishlist" });
  }
};
