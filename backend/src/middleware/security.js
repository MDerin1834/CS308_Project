const helmet = require("helmet");
// const cors = require("cors"); // ❗️ Buradan kaldırıldı, server.js'e taşındı
const express = require("express");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");

const setupSecurity = (app) => {
  // Set security HTTP headers
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(hpp());

  // Rate limiting intentionally disabled (demo needs unlimited calls)
};

module.exports = setupSecurity;
