require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const setupSecurity = require("./middleware/security");
const productRoutes = require("./routes/productRoutes");

const app = express();

// parse JSON body
app.use(express.json());

// 🔐 güvenlik middleware'leri
setupSecurity(app);

// health check
app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/products", productRoutes);

const PORT = process.env.PORT || 5050;

(async () => {
  await connectDB(process.env.MONGO_URI);
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})();
