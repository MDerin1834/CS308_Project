const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const HASHED_PREFIX = "$2";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // 🔹 Kullanıcı rolü (authorization için)
    role: {
      type: String,
      enum: [
        "customer",        // alışveriş yapan kullanıcı
        "support_agent",           // genel sistem yöneticisi
        "sales_manager",     // kampanya, satış yöneticisi
        "product_manager",   // ürün yönetimi
      ],
      default: "customer",
    },

    // 🔹 Ek bilgi: hesap aktif mi?
    isActive: { type: Boolean, default: true },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const getSaltRounds = () => {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
  if (!Number.isFinite(saltRounds) || saltRounds <= 0) {
    throw new Error("Invalid bcrypt salt rounds configuration");
  }
  return saltRounds;
};

const hashPassword = async (password) => {
  if (typeof password !== "string" || password.startsWith(HASHED_PREFIX)) {
    return password;
  }
  const saltRounds = getSaltRounds();
  return bcrypt.hash(password, saltRounds);
};

// Hash password before saving if it has been modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await hashPassword(this.password);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Hash password on bulk inserts (insertMany skips save hooks)
userSchema.pre("insertMany", async function (next, docs) {
  try {
    if (!Array.isArray(docs)) return next();
    for (const doc of docs) {
      if (doc.password) {
        doc.password = await hashPassword(doc.password);
      }
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

// Hash password when updating via query helpers (findOneAndUpdate/updateOne)
const hashPasswordInUpdate = async function (next) {
  const update = this.getUpdate() || {};
  const password =
    update.password ||
    (update.$set && update.$set.password) ||
    (update.$setOnInsert && update.$setOnInsert.password);

  if (!password) return next();

  try {
    const hashedPassword = await hashPassword(password);
    if (update.password) update.password = hashedPassword;
    if (update.$set && update.$set.password) update.$set.password = hashedPassword;
    if (update.$setOnInsert && update.$setOnInsert.password) {
      update.$setOnInsert.password = hashedPassword;
    }
    this.setUpdate(update);
    return next();
  } catch (err) {
    return next(err);
  }
};

userSchema.pre("findOneAndUpdate", hashPasswordInUpdate);
userSchema.pre("updateOne", hashPasswordInUpdate);

// Reuse compiled model in dev to avoid OverwriteModelError with nodemon reloads
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
