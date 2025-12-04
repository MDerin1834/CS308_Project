const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");


async function getWishlist(userId) {
  let wishlist = await Wishlist.findOne({ userId }).lean();

  if (!wishlist) {
    const created = await Wishlist.create({ userId, items: [] });
    wishlist = created.toJSON();
  }

  const productIds = wishlist.items.map((i) => i.productId);
  const products = await Product.find({ id: { $in: productIds } }).lean();
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Her item'e product detayını iliştir
  return wishlist.items.map((i) => ({
    ...i,
    product: productMap.get(i.productId) || null,
  }));
}


async function addToWishlist(userId, productId) {
  const product = await Product.findOne({ id: productId });
  if (!product) {
    const err = new Error("Product not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  let wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({
      userId,
      items: [{ productId }],
    });
    return wishlist;
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


function getDiscountInfo(product) {
  const basePrice = Number(
    product.originalPrice ??
      product.oldPrice ??
      product.priceBeforeDiscount ??
      product.price
  );

  const currentPrice = Number(
    product.discountPrice ?? product.discountedPrice ?? product.price
  );

  if (!basePrice || !currentPrice || currentPrice >= basePrice) {
    return null; // indirim yok
  }

  const discountAmount = basePrice - currentPrice;
  const discountPercent = Math.round((discountAmount / basePrice) * 100);

  return {
    basePrice,
    currentPrice,
    discountAmount,
    discountPercent,
  };
}


async function findDiscountedWishlistItems(userId) {
  const wishlist = await Wishlist.findOne({ userId }).lean();
  if (!wishlist || !wishlist.items || wishlist.items.length === 0) return [];

  const productIds = wishlist.items.map((i) => i.productId);
  const products = await Product.find({ id: { $in: productIds } }).lean();

  return products
    .map((p) => {
      const discount = getDiscountInfo(p);
      if (!discount) return null;

      return {
        productId: p.id,
        name: p.name,
        imageURL: p.imageURL || p.img || "",
        ...discount,
      };
    })
    .filter(Boolean);
}

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  findDiscountedWishlistItems,
};
