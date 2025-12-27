const Comment = require("../models/Comment");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Rating = require("../models/Rating");

// -----------------------------
// 1) Add Comment (from backlog 32)
// -----------------------------
async function addComment(userId, productId, commentText) {
  if (!commentText || commentText.trim().length === 0) {
    const err = new Error("Invalid comment");
    err.code = "INVALID_COMMENT";
    throw err;
  }

  const product = await Product.findOne({ id: productId });
  if (!product) {
    const err = new Error("Product not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const deliveredOrders = await Order.find(
    {
      userId,
      status: "delivered",
      "items.productId": productId,
    },
    { _id: 1 }
  )
    .sort({ createdAt: -1 })
    .lean();

  if (!deliveredOrders.length) {
    const err = new Error("Not delivered");
    err.code = "NOT_DELIVERED";
    throw err;
  }

  const deliveredOrderIds = deliveredOrders.map((o) => o._id);
  const existingComments = await Comment.find(
    { userId, productId, orderId: { $in: deliveredOrderIds } },
    { orderId: 1 }
  ).lean();
  const commentedOrderIds = new Set(existingComments.map((c) => String(c.orderId)));
  const nextOrder = deliveredOrders.find((o) => !commentedOrderIds.has(String(o._id)));

  if (!nextOrder) {
    const err = new Error("Comment limit reached");
    err.code = "COMMENT_LIMIT";
    throw err;
  }

  const newComment = await Comment.create({
    userId,
    productId,
    comment: commentText,
    orderId: nextOrder._id,
    status: "pending",
  });

  return newComment.toJSON();
}

// -----------------------------
// 2) Get Pending Comments
// -----------------------------
async function getPendingComments() {
  const comments = await Comment.find({ status: "pending" })
    .populate("userId", "email username")
    .sort({ createdAt: -1 })
    .lean();

  const userIds = comments
    .map((c) => (c.userId?._id || c.userId || "").toString())
    .filter(Boolean);
  const productIds = comments.map((c) => c.productId).filter(Boolean);

  const ratings = await Rating.find({
    userId: { $in: userIds },
    productId: { $in: productIds },
  }).lean();

  const ratingMap = new Map(
    ratings.map((r) => [`${(r.userId || "").toString()}-${r.productId}`, r.rating])
  );

  return comments.map((c) => ({
    ...c,
    id: c._id?.toString(),
    _id: undefined,
    __v: undefined,
    userEmail: c.userId?.email,
    userName: c.userId?.username,
    userId: c.userId?._id?.toString() || c.userId?.toString(),
    rating: ratingMap.get(
      `${(c.userId?._id || c.userId || "").toString()}-${c.productId}`
    ),
  }));
}

// -----------------------------
// 2b) Get Approved Comments by product
// -----------------------------
async function getApprovedCommentsByProduct(productId) {
  const comments = await Comment.find({
    productId,
    status: "approved",
  })
    .populate("userId", "email username")
    .sort({ createdAt: -1 })
    .lean();

  // Fetch ratings for these users/products
  const ratings = await Rating.find({
    productId,
    userId: { $in: comments.map((c) => c.userId?._id || c.userId) },
  }).lean();

  const ratingMap = new Map(
    ratings.map((r) => [(r.userId || "").toString(), r.rating])
  );

  return comments.map((c) => ({
    ...c,
    id: c._id?.toString(),
    _id: undefined,
    __v: undefined,
    userEmail: c.userId?.email,
    userName: c.userId?.username,
    userId: c.userId?._id?.toString() || c.userId?.toString(),
    rating: ratingMap.get((c.userId?._id || c.userId || "").toString()),
  }));
}

// -----------------------------
// 3) Approve a comment
// -----------------------------
async function approveComment(commentId) {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    const err = new Error("Comment not found");
    err.code = "COMMENT_NOT_FOUND";
    throw err;
  }

  comment.status = "approved";
  await comment.save();

  return comment.toJSON();
}

// -----------------------------
// 4) Reject a comment
// -----------------------------
async function rejectComment(commentId) {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    const err = new Error("Comment not found");
    err.code = "COMMENT_NOT_FOUND";
    throw err;
  }

  comment.status = "rejected";
  await comment.save();

  return comment.toJSON();
}

module.exports = {
  addComment,
  getPendingComments,
  getApprovedCommentsByProduct,
  approveComment,
  rejectComment,
};
