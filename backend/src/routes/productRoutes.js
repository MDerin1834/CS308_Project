const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

/**
 * GET /api/products
 * Query:
 *  - search: string (name | seller)
 *  - category: string
 *  - sort: "price_asc" | "price_desc" | "popularity" | "newest"(default)
 *  - page: number (default 1)
 *  - limit: number (default 24)
 *
 * Response:
 *  {
 *    items: [{ ...product, stockStatus: "in_stock"|"out_of_stock" }, ...],
 *    meta: { total, page, limit, pages, sort }
 *  }
 */
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      category = "",
      sort = "newest",
      page = 1,
      limit = 24,
    } = req.query;

    // ---------- Filter ----------
    const filter = {};
    if (category) filter.category = { $regex: category, $options: "i" };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { seller: { $regex: search, $options: "i" } },
      ];
    }

    // ---------- Sort ----------
    let sortObj = {};
    switch (sort) {
      case "price_asc":
        sortObj = { price: 1, createdAt: -1 };
        break;
      case "price_desc":
        sortObj = { price: -1, createdAt: -1 };
        break;
      case "popularity":
        sortObj = { ratingsCount: -1, ratings: -1, createdAt: -1 };
        break;
      case "newest":
      default:
        sortObj = { createdAt: -1 };
        break;
    }

    // ---------- Paging ----------
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 24));
    const skip = (pageNum - 1) * limitNum;

    // lean() => plain objects; we can add derived fields easily
    const [itemsRaw, total] = await Promise.all([
      Product.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(filter),
    ]);

    // ---------- Enrich with stockStatus ----------
    const items = itemsRaw.map((p) => ({
      ...p,
      stockStatus:
        typeof p.stock === "number" && p.stock > 0 ? "in_stock" : "out_of_stock",
    }));

    return res.status(200).json({
      items,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
        sort,
      },
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/products/:id
 * Returns **all attributes** of a product (+ derived stockStatus)
 */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id }).lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Add derived stockStatus for UI convenience
    const data = {
      ...product,
      stockStatus:
        typeof product.stock === "number" && product.stock > 0
          ? "in_stock"
          : "out_of_stock",
    };

    return res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching product:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
