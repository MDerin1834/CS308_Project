const express = require("express");
const router = express.Router();

const Category = require("../models/Category");
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const authorizeRole = require("../middleware/authorizeRole");
const logger = require("../config/logger");

// GET /api/categories (public)
router.get("/", async (_req, res) => {
  try {
    const [categories, productNames] = await Promise.all([
      Category.find().lean(),
      Product.distinct("category"),
    ]);

    const map = new Map();

    for (const doc of categories) {
      const name = (doc?.name || "").toString().trim();
      if (!name) continue;
      map.set(name.toLowerCase(), { id: doc._id?.toString(), name });
    }

    for (const nameRaw of productNames || []) {
      const name = (nameRaw || "").toString().trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { id: name, name });
      }
    }

    const list = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    return res.status(200).json({ categories: list });
  } catch (err) {
    logger.error("Error fetching categories:", { error: err });
    return res.status(500).json({ message: "Failed to fetch categories" });
  }
});

// POST /api/categories (product manager)
router.post("/", auth, authorizeRole("product_manager"), async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(409).json({ message: "Category already exists" });
    }

    const category = await Category.create({ name });
    return res.status(201).json({ message: "Category created", category });
  } catch (err) {
    logger.error("Error creating category:", { error: err });
    return res.status(500).json({ message: "Failed to create category" });
  }
});

// DELETE /api/categories/:id (product manager)
router.delete("/:id", auth, authorizeRole("product_manager"), async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({ message: "Category deleted", category: deleted });
  } catch (err) {
    logger.error("Error deleting category:", { error: err });
    return res.status(500).json({ message: "Failed to delete category" });
  }
});

module.exports = router;
