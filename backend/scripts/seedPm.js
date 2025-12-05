/**
 * Seed a default Product Manager user.
 *
 * Usage (from backend directory):
 *   PM_EMAIL=pmTeknoSU@gmail.com PM_PASSWORD=TeknoSUpm node scripts/seedPm.js
 * Falls back to the values above if env vars are not provided.
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const logger = require("../src/config/logger");
const User = require("../src/models/User");

const DEFAULTS = {
  email: "pmTeknoSU@gmail.com",
  password: "TeknoSUpm",
  username: "pmTeknoSU",
};

async function seedPm() {
  const email = process.env.PM_EMAIL || DEFAULTS.email;
  const password = process.env.PM_PASSWORD || DEFAULTS.password;
  const username = process.env.PM_USERNAME || DEFAULTS.username;

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required to run the seed.");
  }

  await connectDB(process.env.MONGO_URI);

  const existing = await User.findOne({ email });
  if (existing) {
    logger.info(`ℹ️  PM user already exists with email=${email}`);
    return;
  }

  const user = await User.create({
    username,
    email,
    password,
    role: "product_manager",
  });

  logger.info("✅ Product Manager user seeded successfully", {
    email: user.email,
    id: user._id?.toString(),
  });
}

seedPm()
  .catch((err) => {
    logger.error("❌ Failed to seed PM user", { error: err.message });
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
