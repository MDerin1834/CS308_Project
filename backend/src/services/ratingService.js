const Rating = require("../models/Rating");
const Order = require("../models/Order");
const Product = require("../models/Product");

async function addRating(userId, productId, rating) {
  if (!rating || rating < 1 || rating > 5) {
    const err = new Error("Invalid rating");
    err.code = "INVALID_RATING";
    throw err;
  }

  const product = await Product.findOne({ id: productId });
  if (!product) {
    const err = new Error("Product not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const deliveredOrder = await Order.findOne({
    userId,
    status: "delivered",
    "items.productId": productId,
  });

  if (!deliveredOrder) {
    const err = new Error("Not delivered");
    err.code = "NOT_DELIVERED";
    throw err;
  }

  const existing = await Rating.findOne({ userId, productId });
  if (existing) {
    const err = new Error("Already rated");
    err.code = "ALREADY_RATED";
    throw err;
  }

  const newRating = await Rating.create({
    userId,
    productId,
    rating,
  });

  const total = product.ratings * product.ratingsCount + rating;
  product.ratingsCount += 1;
  product.ratings = total / product.ratingsCount;

  await product.save();

  return { rating: newRating.toJSON(), product: product.toJSON() };
}

module.exports = { addRating };
