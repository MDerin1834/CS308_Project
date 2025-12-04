const mongoose = require("mongoose");
const logger = require("./logger");

async function connectDB(uri) {
  try {
    await mongoose.connect(uri);
    logger.info("✅ MongoDB connected successfully");
  } catch (err) {
    logger.error("❌ MongoDB connection error:", { message: err.message, stack: err.stack });
    process.exit(1);
  }
}

module.exports = connectDB;
