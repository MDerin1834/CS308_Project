const helmet = require("helmet");
// const cors = require("cors"); // ❗️ Buradan kaldırıldı, server.js'e taşındı
const express = require("express");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");

const setupSecurity = (app) => {
  // Set security HTTP headers
  app.use(helmet({ crossOriginResourcePolicy: false }));

  // ❗️ MANUEL CORS AYARI BURADAN KALDIRILDI
  // Sebebi: server.js dosyasında en başa taşındı.

  // Body parser, reading data from body into req.body
  // Bu satır server.js'de zaten var, o yüzden buradan kaldırıldı.
  // app.use(express.json({ limit: "10kb" }));

  // Data sanitization against NoSQL query injection
  // app.use(mongoSanitize()); // ❗️ Çökme hatası verdiği için devre dışı bırakıldı

  // Prevent parameter pollution
  app.use(hpp());

  // Rate limiting intentionally disabled (demo needs unlimited calls)
};

module.exports = setupSecurity;
