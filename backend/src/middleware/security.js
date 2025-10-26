const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

function setupSecurity(app) {
  // CORS ayarı
  app.use(
    cors({
      origin: process.env.CLIENT_URL,
      credentials: true,
    })
  );

  // Helmet → HTTP header güvenliği
  app.use(helmet());

  // Rate limiter → brute force / spam koruması
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // aynı IP'den en fazla 100 istek
    message: "Too many requests, please try again later.",
  });
  app.use(limiter);
}

module.exports = setupSecurity;
