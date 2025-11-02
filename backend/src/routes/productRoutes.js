const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

/**
 * GET /api/products
 * Query params:
 *  - search: string (name | seller içinde arar)
 *  - category: string (kategori adı, case-insensitive)
 *  - sort: "price_asc" | "price_desc" | "popularity" | "newest"(default)
 *  - page: number (opsiyonel; default 1)
 *  - limit: number (opsiyonel; default 24)
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

    // --------- Filtre ----------
    const filter = {};

    if (category) {
      // ör: category=telefon -> /telefon/i
      filter.category = { $regex: category, $options: "i" };
    }

    if (search) {
      // isim veya satıcı alanında arama
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { seller: { $regex: search, $options: "i" } },
      ];
    }

    // --------- Sıralama ----------
    // price_asc | price_desc | popularity | newest
    let sortObj = {};
    switch (sort) {
      case "price_asc":
        sortObj = { price: 1, createdAt: -1 };
        break;
      case "price_desc":
        sortObj = { price: -1, createdAt: -1 };
        break;
      case "popularity":
        // En çok oy + yüksek puan önce
        // (Modelde ratingsCount ve ratings alanları olduğu varsayımıyla)
        sortObj = { ratingsCount: -1, ratings: -1, createdAt: -1 };
        break;
      case "newest":
      default:
        sortObj = { createdAt: -1 };
        break;
    }

    // --------- Sayfalama ----------
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 24));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Product.find(filter).sort(sortObj).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

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
 * Tek ürün detayı (mevcutta varsa korunur; örnek tamlık için bırakıldı)
 */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.status(200).json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
