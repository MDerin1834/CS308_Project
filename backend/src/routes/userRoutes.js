const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateCurrentUser,
} = require("../controllers/userController");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser); 
router.get("/me", auth, getCurrentUser);
router.put("/me", auth, updateCurrentUser);

module.exports = router;
