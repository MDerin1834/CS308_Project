const mongoose = require("mongoose");

/**
 * Product schema — includes all attributes needed by Backlog #18
 * Notes:
 * - imageURL is the canonical image field; 'img' kept for backward compatibility.
 * - toJSON() removes _id and __v; keeps everything else.
 */
const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // e.g., "rtx-3070-ti"
    name: { type: String, required: true },
    model: { type: String, default: "" },
    serialNumber: { type: String, default: "" },
    tag: { type: String, default: "" },

    description: { type: String, default: "" },

    // Optional structured specs (key/value pairs)
    specs: {
      type: Map,
      of: String,
      default: undefined, // if not provided, omit from JSON
    },

    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 }, // physical stock
    quantity: { type: Number, default: 0 }, // optional business usage

    warranty: { type: String, default: "" },      // e.g., "24 months distributor"
    distributor: { type: String, default: "" },   // e.g., "XYZ Dış Ticaret"
    category: { type: String, required: true },   // e.g., "gpu", "cpu", "ssd"
    seller: { type: String, required: true },     // e.g., "TeknoSU"

    ratings: { type: Number, default: 0 },        // average rating
    ratingsCount: { type: Number, default: 0 },   // rating count

    // Images
    imageURL: { type: String, default: "" },      // canonical image field
    img: { type: String, default: "" },           // legacy compatibility

    // Shipping info if needed
    shipping: { type: Number, default: 0 },       // TL
  },
  { timestamps: true }
);

// Clean JSON output
productSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model("Product", productSchema);
