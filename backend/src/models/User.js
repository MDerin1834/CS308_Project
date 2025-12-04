const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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

// Hash password before saving if it has been modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
  if (!Number.isFinite(saltRounds) || saltRounds <= 0) {
    return next(new Error("Invalid bcrypt salt rounds configuration"));
  }

  try {
    this.password = await bcrypt.hash(this.password, saltRounds);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Reuse compiled model in dev to avoid OverwriteModelError with nodemon reloads
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
