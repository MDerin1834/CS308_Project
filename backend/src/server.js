require("dotenv").config();
const path = require("path");
const express = require("express");
const connectDB = require("./config/db");
const setupSecurity = require("./middleware/security");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const cors = require("cors"); // ❗️ CORS'u buraya import et

const app = express();

// ❗️ GÜVENLİK SIRALAMASI ÇOK ÖNEMLİ
// CORS (İzinler) en başa gelmeli.
const corsOptions = {
  origin: 'http://localhost:5173', // Vite'in çalıştığı adres
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // İzin verilen metodlar
  allowedHeaders: ['Content-Type', 'Authorization'], // İzin verilen başlıklar
  credentials: true, // Token/Cookie gibi bilgilerin gönderilmesine izin ver
  optionsSuccessStatus: 200, // Preflight isteği için
};
app.use(cors(corsOptions)); // ❗️ CORS'u HER ŞEYDEN ÖNCE çalıştır

// ✅ Parse JSON request bodies
app.use(express.json());

// ✅ Apply other security middlewares (Helmet, Rate-limit, etc.)
setupSecurity(app);

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

