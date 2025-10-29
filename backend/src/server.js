require("dotenv").config();
const path = require("path");
const express = require("express");
const connectDB = require("./config/db");
const setupSecurity = require("./middleware/security");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const cors = require("cors"); // 🔹 Required for frontend-backend connection

const app = express();

// ✅ Parse JSON request bodies
app.use(express.json());

// ✅ Apply security middlewares (Helmet, Rate-limit, etc.)
setupSecurity(app);

// ✅ Enable CORS for frontend-backend communication
app.use(
  cors({
    origin: "http://localhost:3000", // React frontend address
    credentials: true, // Allow cookies or authorization headers if needed
  })
);

// ✅ Serve static image files
app.use("/images", express.static(path.join(__dirname, "../public/images")));

// ✅ Health check endpoint
app.get("/health", (req, res) => res.json({ ok: true }));

// ✅ Product routes
app.use("/api/products", productRoutes);

// ✅ User routes
app.use("/api/users", userRoutes);

// ✅ Start server
const PORT = process.env.PORT || 5050;

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (error) {
    console.error("❌ Failed to connect to the database:", error);
    process.exit(1);
  }
})();
