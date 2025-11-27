const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const ratingService = require("../services/ratingService");
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
    if (category && category !== "All") filter.category = { $regex: category, $options: "i" };
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

router.post("/", async (req, res) => {
  try {
    const {
      id,
      name,
      price,
      category,
      seller,
      stock = 0,
      description = "",
      imageURL = "",
      model = "",
      serialNumber = "",
      tag = "",
      specs = {},
      warranty = "",
      distributor = "",
      shipping = 0,
    } = req.body;

    if (!id || !name || !price || !category || !seller) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await Product.findOne({ id });
    if (existing) {
      return res.status(400).json({ message: "Product with this ID already exists" });
    }

    const product = new Product({
      id,
      name,
      price,
      category,
      seller,
      stock,
      description,
      imageURL,
      model,
      serialNumber,
      tag,
      specs,
      warranty,
      distributor,
      shipping,
    });

    await product.save();
    return res.status(201).json({ message: "Product created", product });
  } catch (err) {
    console.error("Error creating product:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/products/:id/rating
router.post("/:id/rating", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;
    const { rating } = req.body;

    const result = await ratingService.addRating(userId, productId, rating);

    return res.status(201).json({
      message: "Rating submitted successfully",
      rating: result.rating,
      product: result.product,
    });
  } catch (err) {
    console.error("❌ Rating error:", err);

    if (err.code === "INVALID_RATING")
      return res.status(400).json({ message: "Rating must be between 1 and 5" });

    if (err.code === "NOT_FOUND")
      return res.status(404).json({ message: "Product not found" });

    if (err.code === "NOT_DELIVERED")
      return res.status(403).json({ message: "You can only rate delivered products" });

    if (err.code === "ALREADY_RATED")
      return res.status(409).json({ message: "You already rated this product" });

    return res.status(500).json({ message: "Failed to submit rating" });
  }
});

module.exports = router;
