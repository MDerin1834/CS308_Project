require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const logger = require("../src/config/logger");
const User = require("../src/models/User");

const DEFAULTS = {
  email: "smTeknoSU@gmail.com",
  password: "TeknoSUsm",
  username: "smTeknoSU",
};

async function seedSm() {
  const email = process.env.SM_EMAIL || DEFAULTS.email;
  const password = process.env.SM_PASSWORD || DEFAULTS.password;
  const username = process.env.SM_USERNAME || DEFAULTS.username;

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required to run the seed.");
  }

  await connectDB(process.env.MONGO_URI);

  const existing = await User.findOne({ email });
  if (existing) {
    logger.info(`ℹ️  SM user already exists with email=${email}`);
    return;
  }

  const user = await User.create({
    username,
    email,
    password,
    role: "sales_manager",
  });

  logger.info("✅ Sales Manager user seeded successfully", {
    email: user.email,
    id: user._id?.toString(),
  });
}

seedSm()
  .catch((err) => {
    logger.error("❌ Failed to seed SM user", { error: err.message });
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
