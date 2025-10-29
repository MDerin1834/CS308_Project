const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// ✅ Get all products or filter by category
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;

    // 🔹 If category query is provided, filter products by category (case-insensitive)
    const filter = category
      ? { category: { $regex: category, $options: "i" } }
      : {};

    const products = await Product.find(filter);
    res.json(products);
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

    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
