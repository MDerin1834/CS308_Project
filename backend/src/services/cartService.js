const Cart = require("../models/Cart");
const Product = require("../models/Product");

/**
 * guestCart: [{ product: "<productId>", quantity: number }, ...]
 * Mantık:
 * - Aynı üründe miktarı topla.
 * - Toplam miktarı stokla sınırla (Product.quantity).
 * - Stok dışı/0 olanları ele.
 */
async function mergeGuestCartToUser(userId, guestCart = []) {
  // Kullanıcı sepetini getir/oluştur
  let userCart = await Cart.findOne({ user: userId });
  if (!userCart) userCart = await Cart.create({ user: userId, items: [] });

  if (!Array.isArray(guestCart) || guestCart.length === 0) {
    // Boşsa hiçbir şey yapma; mevcut sepeti döndür
    return await userCart.populate("items.product");
  }

  // Mevcut sepeti map’e çek
  const currentMap = new Map();
  for (const it of userCart.items) {
    currentMap.set(String(it.product), { product: String(it.product), quantity: it.quantity });
  }

  // Guest sepeti ekle
  for (const g of guestCart) {
    if (!g || !g.product) continue;
    const pid = String(g.product);
    const addQty = Number(g.quantity) || 0;
    if (addQty <= 0) continue;
    const prev = currentMap.get(pid) || { product: pid, quantity: 0 };
    prev.quantity += addQty;
    currentMap.set(pid, prev);
  }

  // Stok kontrolü
  const productIds = Array.from(currentMap.keys());
  const products = await Product.find({ _id: { $in: productIds } }, { quantity: 1 });
  const stockMap = new Map(products.map(p => [String(p._id), p.quantity]));

  const mergedItems = [];
  for (const [pid, entry] of currentMap) {
    const stock = stockMap.get(pid);
    if (typeof stock !== "number") continue; // ürün yoksa
    const finalQty = Math.min(Math.max(entry.quantity, 0), stock);
    if (finalQty > 0) mergedItems.push({ product: pid, quantity: finalQty });
  }

  userCart.items = mergedItems;
  await userCart.save();
  return await userCart.populate("items.product");
}

module.exports = { mergeGuestCartToUser };
