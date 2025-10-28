require("dotenv").config();
const path = require("path");
const express = require("express");
const connectDB = require("./config/db");
const setupSecurity = require("./middleware/security");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
app.use(express.json());
setupSecurity(app);

// 🖼️ Statik /public klasörünü serve et
app.use("/images", express.static(path.join(__dirname, "../public/images")));

// health check
app.get("/health", (req, res) => res.json({ ok: true }));

// Product endpoint’leri
app.use("/api/products", productRoutes);

app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5050;

(async () => {
  await connectDB(process.env.MONGO_URI);
  app.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
  );
})();
