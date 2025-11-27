const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: String, required: true }, // Product.id
    comment: { type: String, required: true, minlength: 1, maxlength: 2000 },
    approved: { type: Boolean, default: false }, // Product manager approves later
  },
  { timestamps: true }
);

commentSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Comment", commentSchema);
