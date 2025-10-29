const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// ✅ Get all products, filter by category, or search by name/description
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;

    // 🔹 Build a flexible filter object
    let filter = {};

    // 🔹 If category is provided, filter by category (case-insensitive)
    if (category) {
      filter.category = { $regex: category, $options: "i" };
    }

    // 🔹 If search is provided, match product name or description (case-insensitive)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // 🔹 Fetch products that match the filter
    const products = await Product.find(filter);

    res.status(200).json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get a product by its custom 'id' field
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    res.status(200).json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
