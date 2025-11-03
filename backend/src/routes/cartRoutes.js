const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// ⬇️ EK: servis
const { mergeGuestCartToUser } = require("../services/cartService");

// ... mevcut cart route'ların burada kalacak ...

/**
 * POST /api/cart/merge
 * Body: { guestCart: [{ product: "<id>", quantity: number }, ...] }
 * Auth zorunlu.
 */
router.post("/merge", auth, async (req, res) => {
  try {
    const userId = req.user && (req.user.id || req.user._id);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { guestCart } = req.body || {};
    const cart = await mergeGuestCartToUser(userId, guestCart);
    return res.json({ message: "Cart merged", cart });
  } catch (err) {
    console.error("POST /api/cart/merge error:", err);
    return res.status(500).json({ message: "Failed to merge cart" });
  }
});

module.exports = router;
