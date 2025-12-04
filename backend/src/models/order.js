const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true }, // Product.id aligns with cart items
    name: { type: String, required: true },
    imageURL: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true }, // unit price captured at order time
    lineTotal: { type: Number, required: true }, // quantity * unitPrice
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: "" },
    city: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
    phone: { type: String, default: "" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    items: { type: [orderItemSchema], default: [] },

    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true, default: 0 },
    shipping: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },

    status: {
      type: String,
      enum: ["processing", "paid", "cancelled", "in-transit", "delivered"],
      default: "processing",
    },
    paidAt: { type: Date },
    invoiceNumber: { type: String },
    refundedAt: { type: Date },
    refundAmount: { type: Number },
    refundReason: { type: String },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

orderSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Order", orderSchema);
