const mongoose = require("mongoose");

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

module.exports = mongoose.model("User", userSchema);
