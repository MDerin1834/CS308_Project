const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");

const Product = require("../models/Product");
const auth = require("../middleware/auth");
const ratingService = require("../services/ratingService");
const commentService = require("../services/commentService");

/* ============== ROLE CHECK: PRODUCT MANAGER ============== */

function requireProductManager(req, res, next) {
  if (!req.user || req.user.role !== "product_manager") {
    return res
      .status(403)
      .json({ message: "Only product managers can manage products" });
  }
  next();
}

/* ============== MULTER: IMAGE UPLOAD AYARI ============== */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // server.js -> app.use("/images", express.static(path.join(__dirname, "./public/images")));
    // Buraya kaydedilen dosyalar /images/<filename> ile serve edilecek
    cb(null, path.join(__dirname, "../public/images"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base =
      (req.body.id || file.fieldname + "-" + Date.now())
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]/gi, "_"); // güvenli dosya adı

    cb(null, `${base}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

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
    if (category && category !== "All")
      filter.category = { $regex: category, $options: "i" };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
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

/**
 * DELETE /api/products/:id
 * Backlog 35: Product Manager ürün silebilsin.
 * - Sadece role === "product_manager" olan kullanıcılar
 * - Product.id üzerinden silme
 */
router.delete("/:id", auth, requireProductManager, async (req, res) => {
  try {
    const productId = req.params.id;

    const deleted = await Product.findOneAndDelete({ id: productId });
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product deleted successfully",
      product: deleted,
    });
  } catch (err) {
    console.error("Error deleting product:", err);
    return res.status(500).json({ message: "Failed to delete product" });
  }
});

/**
 *  - Sadece product_manager rolü
 *  - stock >= 0, sayı olmalı
 *  - Product.id ile bulunup güncellenir
 */
router.put("/:id/stock", auth, requireProductManager, async (req, res) => {
  try {
    const { stock } = req.body;

    const newStock = Number(stock);
    if (!Number.isFinite(newStock) || newStock < 0) {
      return res
        .status(400)
        .json({ message: "Stock must be a non-negative number" });
    }

    const product = await Product.findOneAndUpdate(
      { id: req.params.id },
      { $set: { stock: newStock } },
      { new: true, lean: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Stock updated successfully",
      product,
    });
  } catch (err) {
    console.error("Error updating stock:", err);
    return res.status(500).json({ message: "Failed to update stock" });
  }
});

router.post(
  "/",
  auth,
  requireProductManager,
  upload.single("image"),
  async (req, res) => {
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
        warranty = "",
        distributor = "",
        shipping = 0,
      } = req.body;

      // specs için: ister JSON string, ister hiç gelmesin
      let specs;
      if (req.body.specs) {
        try {
          const parsed = JSON.parse(req.body.specs);
          if (parsed && typeof parsed === "object") {
            specs = parsed;
          }
        } catch {
          // specs parse edilemezse yok sayıyoruz
        }
      }

      if (!id || !name || !price || !category || !seller) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const existing = await Product.findOne({ id });
      if (existing) {
        return res
          .status(400)
          .json({ message: "Product with this ID already exists" });
      }

      // Image URL kararı:
      // - Eğer file upload geldiyse => /images/<filename>
      // - Yoksa body.imageURL varsa onu kullan
      let finalImageURL = imageURL;
      if (req.file) {
        finalImageURL = `/images/${req.file.filename}`;
      }

      const product = new Product({
        id,
        name,
        price,
        category,
        seller,
        stock,
        description,
        imageURL: finalImageURL,
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

      if (err.message === "Only image files are allowed") {
        return res.status(400).json({ message: err.message });
      }

      return res.status(500).json({ message: "Server error" });
    }
  }
);

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
      return res
        .status(403)
        .json({ message: "You can only rate delivered products" });

    if (err.code === "ALREADY_RATED")
      return res.status(409).json({ message: "You already rated this product" });

    return res.status(500).json({ message: "Failed to submit rating" });
  }
});

// POST /api/products/:id/comment
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;
    const { comment } = req.body;

    const newComment = await commentService.addComment(
      userId,
      productId,
      comment
    );

    return res.status(201).json({
      message: "Comment submitted successfully (Pending approval)",
      comment: newComment,
    });
  } catch (err) {
    console.error("❌ Comment error:", err);

    if (err.code === "INVALID_COMMENT")
      return res.status(400).json({ message: "Comment cannot be empty" });

    if (err.code === "NOT_FOUND")
      return res.status(404).json({ message: "Product not found" });

    if (err.code === "NOT_DELIVERED")
      return res
        .status(403)
        .json({ message: "You can only comment after product is delivered" });

    return res.status(500).json({ message: "Failed to submit comment" });
  }
});

module.exports = router;
