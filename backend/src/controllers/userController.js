const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// JWT oluşturucu yardımcı fonksiyon
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// REGISTER
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Gerekli alan kontrolü
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Email veya username mevcut mu?
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email or username already exists" });
    }

    // Şifre hashleme
    const hashedPassword = await bcrypt.hash(password, 10);

    // Yeni kullanıcı oluştur
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "customer",
    });

    // Token oluştur
    const token = generateToken(newUser);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
