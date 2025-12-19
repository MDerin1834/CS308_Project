const mongoose = require("mongoose");

// Backlog 19: per-user cart storage with price snapshots
const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true }, 
    quantity: { type: Number, required: true, min: 1 },
    priceSnapshot: { type: Number, required: true }, 
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
