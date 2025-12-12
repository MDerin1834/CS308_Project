const mongoose = require("mongoose");

/**
 * Product schema — includes all attributes needed by Backlog #18
 * Notes:
 * - imageURL is the canonical image field; 'img' kept for backward compatibility.
 * - toJSON() removes _id and __v; keeps everything else.
 */
const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, 
    name: { type: String, required: true },
    model: { type: String, default: "" },
    serialNumber: { type: String, default: "" },
    tag: { type: String, default: "" },

    description: { type: String, default: "" },

    // Optional structured specs (key/value pairs)
    specs: {
      type: Map,
      of: String,
      default: undefined, 
    },

    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 }, 
    quantity: { type: Number, default: 0 }, 

    warranty: { type: String, default: "" },    
    distributor: { type: String, default: "" },   
    category: { type: String, required: true },   
    seller: { type: String, required: true },    

    ratings: { type: Number, default: 0 },       
    ratingsCount: { type: Number, default: 0 },  

    // Images
    imageURL: { type: String, default: "" },      
    img: { type: String, default: "" },          

    // Shipping info if needed
    shipping: { type: Number, default: 0 },       
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
