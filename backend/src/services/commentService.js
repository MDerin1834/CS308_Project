const Comment = require("../models/Comment");
const Order = require("../models/Order");
const Product = require("../models/Product");

async function addComment(userId, productId, commentText) {
  // 1) Yorum boş mu?
  if (!commentText || commentText.trim().length === 0) {
    const err = new Error("Invalid comment");
    err.code = "INVALID_COMMENT";
    throw err;
  }

  // 2) Ürün var mı?
  const product = await Product.findOne({ id: productId });
  if (!product) {
    const err = new Error("Product not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  // 3) Kullanıcı bu ürünü gerçekten satın almış mı + teslim edilmiş mi?
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

  // 4) Yorum oluştur (default approved: false)
  const newComment = await Comment.create({
    userId,
    productId,
    comment: commentText,
    approved: false, // PM approval required
  });

  return newComment.toJSON();
}

module.exports = { addComment };
