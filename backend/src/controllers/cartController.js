const Cart = require("../models/Cart");
const Product = require("../models/Product");

// GET /api/cart  — sepet ve özet döner
exports.getCart = async (req, res) => {
  const cart =
    (await Cart.findOne({ userId: req.user.id }).lean()) || { items: [] };

  const subtotal = cart.items.reduce(
    (s, it) => s + (it.priceSnapshot || 0) * (it.quantity || 0),
    0
  );
  const itemCount = cart.items.reduce((s, it) => s + (it.quantity || 0), 0);

  return res.json({ items: cart.items, subtotal, itemCount });
};

// POST /api/cart  — sepete ekle/güncelle (stok doğrulaması)
exports.addOrUpdateItem = async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || !Number.isFinite(+quantity) || +quantity < 1) {
    return res
      .status(400)
      .json({ message: "productId and positive quantity are required" });
  }

  const product = await Product.findOne({ id: productId }).lean();
  if (!product) return res.status(404).json({ message: "Product not found" });

  if ((product.stock ?? 0) < +quantity) {
    return res
      .status(409)
      .json({ message: "Insufficient stock", available: product.stock ?? 0 });
  }

  let cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) cart = await Cart.create({ userId: req.user.id, items: [] });

  const idx = cart.items.findIndex((it) => it.productId === productId);
  if (idx === -1) {
    cart.items.push({
      productId,
      quantity: +quantity,
      priceSnapshot: product.price,
    });
  } else {
    // mevcut item'ı yeni miktara çek
    if ((product.stock ?? 0) < +quantity) {
      return res
        .status(409)
        .json({ message: "Insufficient stock", available: product.stock ?? 0 });
    }
    cart.items[idx].quantity = +quantity;
    cart.items[idx].priceSnapshot = product.price; // fiyatı güncelle
  }

  await cart.save();
  // tek noktadan yanıt
  return exports.getCart(req, res);
};

// DELETE /api/cart/:productId — sepetten çıkar
exports.removeItem = async (req, res) => {
  const { productId } = req.params;
  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) return res.status(404).json({ message: "Cart not found" });
  cart.items = cart.items.filter((it) => it.productId !== productId);
  await cart.save();
  return exports.getCart(req, res);
};

// POST /api/cart/merge — guest sepeti kullanıcı sepetiyle birleştir (stok limitli)
exports.mergeGuestCart = async (req, res) => {
  const incoming = Array.isArray(req.body.items) ? req.body.items : [];

  let cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) cart = await Cart.create({ userId: req.user.id, items: [] });

  for (const it of incoming) {
    if (!it || !it.productId) continue;
    const q = Math.max(1, Number(it.quantity || 1));

    const product = await Product.findOne({ id: it.productId }).lean();
    if (!product) continue;
    const allowed = Math.min(q, product.stock ?? 0);
    if (allowed < 1) continue;

    const idx = cart.items.findIndex((c) => c.productId === it.productId);
    if (idx === -1) {
      cart.items.push({
        productId: it.productId,
        quantity: allowed,
        priceSnapshot: product.price,
      });
    } else {
      const newQty = Math.min(cart.items[idx].quantity + allowed, product.stock ?? 0);
      cart.items[idx].quantity = newQty;
      cart.items[idx].priceSnapshot = product.price;
    }
  }

  await cart.save();
  return exports.getCart(req, res);
};
