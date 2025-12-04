require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const setupSecurity = require("./middleware/security");
const { requestLogger, errorLogger } = require("./middleware/logger");
const logger = require("./config/logger");

// Routes
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");

const app = express();
const wishlistRoutes = require("./routes/wishlistRoutes"); 

/* ---------- CORS (ÖNCE) ---------- */
const corsOptions = {
  origin: "http://localhost:5173", // Vite front-end
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

/* ---------- Body Parser ---------- */
app.use(express.json());

/* ---------- Logging ---------- */
app.use(requestLogger);

/* ---------- Güvenlik ---------- */
setupSecurity(app);

/* ---------- Statik dosyalar ---------- */
app.use("/images", express.static(path.join(__dirname, "../public/images")));

/* ---------- Health ---------- */
app.get("/health", (_req, res) => res.json({ ok: true }));

/* ---------- API Rotaları ---------- */
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/comments", require("./routes/commentRoutes"));
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/delivery", deliveryRoutes);

/* ---------- Error Logging ---------- */
app.use(errorLogger);

/* ---------- Sunucu ---------- */
const PORT = process.env.PORT || 5050;

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT}`));
  } catch (error) {
    logger.error("❌ Failed to connect to the database:", { error });
    process.exit(1);
  }
})();

// (Opsiyonel) Testlerde kullanmak için:
// module.exports = app;
