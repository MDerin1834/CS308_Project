const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { mergeGuestCartToUser, getCartSummary } = require("../services/cartService");

// (Opsiyonel) Var olan controller fonksiyonlarını yut (varsa ekle, yoksa geç)
let ctrl = {};
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  ctrl = require("../controllers/cartController");
} catch (_) {
  ctrl = {};
}

// ---- Var olan klasik cart endpoint'lerin varsa mount et (opsiyonel) ----
if (typeof ctrl.getCart === "function")       router.get("/", auth, ctrl.getCart);
if (typeof ctrl.addItem === "function")       router.post("/", auth, ctrl.addItem);
if (typeof ctrl.updateItem === "function")    router.put("/:productId", auth, ctrl.updateItem);
if (typeof ctrl.removeItem === "function")    router.delete("/:productId", auth, ctrl.removeItem);
if (typeof ctrl.clearCart === "function")     router.delete("/", auth, ctrl.clearCart);

// ---------------- Backlog 22: guest cart merge ----------------
/**
 * POST /api/cart/merge
 * Body: { guestCart: [{ product:"<id>", quantity:Number }, ...] }
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

// ---------------- Backlog 23: checkout summary ----------------
/**
 * GET /api/cart/summary
 * Döner:
 * {
 *   items: [{ productId, name, price, quantity, lineTotal }],
 *   itemCount: Number,
 *   subtotal: Number,
 *   currency: "TRY"
 * }
 */
router.get("/summary", auth, async (req, res) => {
  try {
    const userId = req.user && (req.user.id || req.user._id);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const summary = await getCartSummary(userId);
    return res.json(summary);
  } catch (err) {
    console.error("GET /api/cart/summary error:", err);
    return res.status(500).json({ message: "Failed to get cart summary" });
  }
});

module.exports = router;
