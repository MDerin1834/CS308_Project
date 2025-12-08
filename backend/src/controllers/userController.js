const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("../config/logger");
const auth = require("../middleware/auth");

// Helper function for JWT creation
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
    const { username, email, password, role, fullName, taxId, homeAddress } = req.body;

    const isCustomer = !role || role === "customer";

    // Required field check
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: "fullName is required" });
    }

    if (isCustomer) {
      if (!taxId) {
        return res.status(400).json({ message: "taxId is required for customers" });
      }
      if (
        !homeAddress ||
        !homeAddress.addressLine1 ||
        !homeAddress.city ||
        !homeAddress.country ||
        !homeAddress.postalCode
      ) {
        return res.status(400).json({ message: "homeAddress is incomplete for customers" });
      }
    }

    // Check if email or username exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email or username already exists" });
    }

    // Create new user
    const newUser = await User.create({
      username,
      fullName: fullName || username,
      email,
      password,
      role: role || "customer",
      taxId: taxId || "",
      homeAddress: homeAddress || {},
    });

    // Create token
    const token = generateToken(newUser);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        taxId: newUser.taxId,
        homeAddress: newUser.homeAddress,
      },
      token,
    });
  } catch (error) {
    logger.error("Register error", { error });
    res.status(500).json({ message: "Server error" });
  }
};
// LOGIN
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Field check
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        taxId: user.taxId,
        homeAddress: user.homeAddress,
      },
      token,
    });
  } catch (error) {
    logger.error("Login error", { error });
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/users/me
exports.getCurrentUser = [
  auth,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id).lean();
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        message: "Profile fetched successfully",
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          taxId: user.taxId,
          homeAddress: user.homeAddress,
        },
      });
    } catch (error) {
      logger.error("Get current user error", { error });
      return res.status(500).json({ message: "Server error" });
    }
  },
];

// PUT /api/users/me
exports.updateCurrentUser = [
  auth,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role !== "customer") {
        return res.status(403).json({ message: "Only customers can update profile fields" });
      }

      const { fullName, taxId, homeAddress } = req.body || {};

      if (!taxId) {
        return res.status(400).json({ message: "taxId is required" });
      }
      if (
        !homeAddress ||
        !homeAddress.addressLine1 ||
        !homeAddress.city ||
        !homeAddress.country ||
        !homeAddress.postalCode
      ) {
        return res.status(400).json({ message: "homeAddress is incomplete" });
      }

      if (fullName && fullName.trim()) {
        user.fullName = fullName.trim();
      }
      user.taxId = taxId;
      user.homeAddress = {
        addressLine1: homeAddress.addressLine1,
        addressLine2: homeAddress.addressLine2 || "",
        city: homeAddress.city,
        country: homeAddress.country,
        postalCode: homeAddress.postalCode,
        phone: homeAddress.phone || "",
      };

      await user.save();

      return res.status(200).json({
        message: "Profile updated successfully",
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          taxId: user.taxId,
          homeAddress: user.homeAddress,
        },
      });
    } catch (error) {
      logger.error("Update current user error", { error });
      return res.status(500).json({ message: "Server error" });
    }
  },
];

// LOGOUT
exports.logoutUser = async (req, res) => {
  try {
    // Deleting the token on the frontend side is sufficient
    // Clear the cookie here (If the token is stored in a cookie)
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    logger.error("Logout error", { error });
    res.status(500).json({ message: "Server error" });
  }
};
