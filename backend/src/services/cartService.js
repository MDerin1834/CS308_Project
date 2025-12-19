const Cart = require("../models/Cart");
const Product = require("../models/Product");


// Backlog 22: merge guest cart items into the user's cart safely with stock caps
async function mergeGuestCartToUser(userId, guestCart = []) {
  let userCart = await Cart.findOne({ user: userId });
  if (!userCart) userCart = await Cart.create({ user: userId, items: [] });

  if (!Array.isArray(guestCart) || guestCart.length === 0) {
    return await userCart.populate("items.product");
  }

  const currentMap = new Map();
  for (const it of userCart.items) {
    currentMap.set(String(it.product), {
      product: String(it.product),
      quantity: Number(it.quantity) || 0,
    });
  }

  for (const g of guestCart) {
    if (!g || !g.product) continue;
    const pid = String(g.product);
    const addQty = Number(g.quantity) || 0;
    if (addQty <= 0) continue;
    const prev = currentMap.get(pid) || { product: pid, quantity: 0 };
    prev.quantity += addQty;
    currentMap.set(pid, prev);
  }

  const productIds = Array.from(currentMap.keys());
  const products = await Product.find(
    { _id: { $in: productIds } },
    { quantity: 1 }
  ).lean();
  const stockMap = new Map(products.map(p => [String(p._id), Number(p.quantity) || 0]));

  const mergedItems = [];
  for (const [pid, entry] of currentMap) {
    const stock = stockMap.get(pid);
    if (typeof stock !== "number") continue; // ürün bulunamadıysa
    const finalQty = Math.min(Math.max(Number(entry.quantity) || 0, 0), stock);
    if (finalQty > 0) mergedItems.push({ product: pid, quantity: finalQty });
  }

  userCart.items = mergedItems;
  await userCart.save();
  return await userCart.populate("items.product");
}

// Backlog 23: build lightweight cart summary for checkout views
async function getCartSummary(userId) {
  const cart = await Cart.findOne({ user: userId }).lean();
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return { items: [], itemCount: 0, subtotal: 0, currency: "TRY" };
  }

  const productIds = cart.items.map(i => String(i.product));
  const products = await Product.find(
    { _id: { $in: productIds } },
    { name: 1, price: 1 }
  ).lean();

  const pmap = new Map(products.map(p => [String(p._id), p]));

  const summaryItems = [];
  let subtotal = 0;

  for (const it of cart.items) {
    const p = pmap.get(String(it.product));
    if (!p) continue;
    const quantity = Math.max(Number(it.quantity) || 0, 0);
    if (quantity <= 0) continue;

    const price = Number(p.price) || 0;
    const lineTotal = price * quantity;
    subtotal += lineTotal;

    summaryItems.push({
      productId: String(it.product),
      name: p.name,
      price,
      quantity,
      lineTotal,
    });
  }

  return {
    items: summaryItems,
    itemCount: summaryItems.reduce((acc, x) => acc + x.quantity, 0),
    subtotal,
    currency: "TRY",
  };
}

module.exports = {
  mergeGuestCartToUser,
  getCartSummary,
};
