const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");

const auth = require("../middleware/auth");
const authorizeRole = require("../middleware/authorizeRole");
const Product = require("../models/Product");
const Wishlist = require("../models/Wishlist");
const User = require("../models/User");
const ratingService = require("../services/ratingService");
const commentService = require("../services/commentService");
const { sendWishlistDiscountEmail } = require("../services/emailService");
const logger = require("../config/logger");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/images"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base =
      (req.body.id || file.fieldname + "-" + Date.now())
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]/gi, "_"); 

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
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

function buildDiscountPayload({ basePrice, discountPrice }) {
  const discountAmount = basePrice - discountPrice;
  const discountPercent = Math.round((discountAmount / basePrice) * 100);
  return { discountAmount, discountPercent };
}

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
    logger.error("Error fetching products:", { error: err });
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
    logger.error("Error fetching product:", { error: err });
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete(
  "/:id",
  auth,
  authorizeRole("product_manager"),
  async (req, res) => {
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
    logger.error("Error deleting product:", { error: err });
    return res.status(500).json({ message: "Failed to delete product" });
  }
});


router.put("/:id/stock", auth, authorizeRole("product_manager"), async (req, res) => {
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
    logger.error("Error updating stock:", { error: err });
    return res.status(500).json({ message: "Failed to update stock" });
  }
});

router.post(
  "/",
  auth,
  authorizeRole("product_manager"),
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
        cost = null,
      } = req.body;

      let specs;
      if (req.body.specs) {
        try {
          const parsed = JSON.parse(req.body.specs);
          if (parsed && typeof parsed === "object") {
            specs = parsed;
          }
        } catch {
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
        cost: Number.isFinite(Number(cost)) ? Number(cost) : null,
      });

      await product.save();
      return res.status(201).json({ message: "Product created", product });
    } catch (err) {
      logger.error("Error creating product:", { error: err });

      if (err.message === "Only image files are allowed") {
        return res.status(400).json({ message: err.message });
      }

      return res.status(500).json({ message: "Server error" });
    }
  }
);

// PATCH /api/products/:id/discount (sales manager)
router.patch("/:id/discount", auth, authorizeRole("sales_manager"), async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const clear = req.body.clear === true;
    const rawPercent = req.body.discountPercent;
    const rawPrice = req.body.discountPrice;

    if (clear) {
      if (Number.isFinite(product.originalPrice)) {
        product.price = product.originalPrice;
      }
      product.originalPrice = null;
      product.discountPrice = null;
      product.discountPercent = null;
      await product.save();
      return res.status(200).json({ message: "Discount cleared", product });
    }

    const basePrice = Number(product.originalPrice ?? product.price);
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      return res.status(400).json({ message: "Invalid base price for discount" });
    }

    let discountPrice;
    let discountPercent;

    if (rawPercent !== undefined && rawPercent !== null && rawPercent !== "") {
      const percent = Number(rawPercent);
      if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) {
        return res.status(400).json({ message: "discountPercent must be between 0 and 100" });
      }
      discountPrice = Number((basePrice * (1 - percent / 100)).toFixed(2));
      discountPercent = Math.round(percent);
    } else if (rawPrice !== undefined && rawPrice !== null && rawPrice !== "") {
      const priceNum = Number(rawPrice);
      if (!Number.isFinite(priceNum) || priceNum <= 0 || priceNum >= basePrice) {
        return res.status(400).json({ message: "discountPrice must be greater than 0 and below base price" });
      }
      discountPrice = Number(priceNum.toFixed(2));
      discountPercent = buildDiscountPayload({ basePrice, discountPrice }).discountPercent;
    } else {
      return res.status(400).json({ message: "discountPercent or discountPrice is required" });
    }

    if (!Number.isFinite(product.originalPrice)) {
      product.originalPrice = basePrice;
    }

    product.discountPrice = discountPrice;
    product.discountPercent = discountPercent;
    product.price = discountPrice;
    await product.save();

    const wishlists = await Wishlist.find({ "items.productId": product.id }).lean();
    const userIds = wishlists.map((w) => w.userId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }, { email: 1, username: 1, name: 1 }).lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const discountInfo = {
      productId: product.id,
      name: product.name,
      currentPrice: discountPrice,
      basePrice,
      discountPercent,
    };

    const emailResults = await Promise.allSettled(
      wishlists.map((w) => {
        const user = userMap.get(String(w.userId));
        if (!user?.email) return Promise.resolve({ skipped: true, reason: "no_email" });
        return sendWishlistDiscountEmail({
          to: user.email,
          username: user.username || user.name || user.email,
          items: [discountInfo],
        });
      })
    );

    const notifiedCount = emailResults.filter(
      (r) => r.status === "fulfilled" && r.value && r.value.skipped !== true
    ).length;

    return res.status(200).json({
      message: "Discount applied",
      product,
      wishlistNotifications: notifiedCount,
    });
  } catch (err) {
    logger.error("Error applying discount:", { error: err });
    return res.status(500).json({ message: "Failed to apply discount" });
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
    logger.error("❌ Rating error:", { error: err });

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
    logger.error("❌ Comment error:", { error: err });

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
