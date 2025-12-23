require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const logger = require("../src/config/logger");
const User = require("../src/models/User");

const DEFAULTS = {
  email: "SupportManager@gmail.com",
  password: "TeknoSU",
  username: "SupportManager",
};

async function seedSupportManager() {
  const email = process.env.SUPPORT_EMAIL || DEFAULTS.email;
  const password = process.env.SUPPORT_PASSWORD || DEFAULTS.password;
  const username = process.env.SUPPORT_USERNAME || DEFAULTS.username;

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required to run the seed.");
  }

  await connectDB(process.env.MONGO_URI);

  const existing = await User.findOne({ email });
  if (existing) {
    logger.info(`ℹ️  Support agent already exists with email=${email}`);
    return;
  }

  const user = await User.create({
    username,
    email,
    password,
    role: "support_agent",
  });

  logger.info("✅ Support agent seeded successfully", {
    email: user.email,
    id: user._id?.toString(),
  });
}

seedSupportManager()
  .catch((err) => {
    logger.error("❌ Failed to seed support agent", { error: err.message });
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
