const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

async function getWishlist(userId) {
  let wishlist = await Wishlist.findOne({ userId }).lean();
  if (!wishlist) {
    wishlist = await Wishlist.create({ userId, items: [] });
    wishlist = wishlist.toJSON();
  }

  const productIds = wishlist.items.map(i => i.productId);
  const products = await Product.find({ id: { $in: productIds } }).lean();

  const productMap = new Map(products.map(p => [p.id, p]));

  const enriched = wishlist.items.map(i => ({
    ...i,
    product: productMap.get(i.productId) || null,
  }));

  return enriched;
}

async function addToWishlist(userId, productId) {
  const product = await Product.findOne({ id: productId });
  if (!product) {
    const err = new Error("Product not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) {
    return Wishlist.create({
      userId,
      items: [{ productId }],
    });
  }

  const exists = wishlist.items.some((i) => i.productId === productId);
  if (exists) {
    const err = new Error("Already in wishlist");
    err.code = "ALREADY_EXISTS";
    throw err;
  }

  wishlist.items.push({ productId });
  await wishlist.save();
  return wishlist;
}

async function removeFromWishlist(userId, productId) {
  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    const err = new Error("Wishlist not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  wishlist.items = wishlist.items.filter((i) => i.productId !== productId);
  await wishlist.save();

  return wishlist;
}

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
