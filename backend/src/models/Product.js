const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // örn: brother-ads-2700w
    category: { type: String, required: true },
    name: { type: String, required: true },
    seller: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    ratings: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },
    img: { type: String, required: true },
    shipping: { type: Number, required: true },
    quantity: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
