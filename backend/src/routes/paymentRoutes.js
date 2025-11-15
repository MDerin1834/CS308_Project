const express = require("express");
const router = express.Router();

// Mock payment validation function
function validateCard({ cardNumber, expiryMonth, expiryYear, cvv, cardHolder }) {
  // ➤ Basic validation rules

  // Card number must be 16 digits
  if (!/^\d{16}$/.test(cardNumber)) return false;

  // CVV must be 3 digits
  if (!/^\d{3}$/.test(cvv)) return false;

  // Expiry month must be 01 - 12
  const month = parseInt(expiryMonth);
  if (month < 1 || month > 12) return false;

  // Expiry year must be >= current year
  const currentYear = new Date().getFullYear();
  if (parseInt(expiryYear) < currentYear) return false;

  // Card holder name must contain at least 2 words
  if (!/^[A-Za-z ]+$/.test(cardHolder)) return false;

  return true;
}

// ✅ POST: Mock payment endpoint
router.post("/checkout", (req, res) => {
  const { cardNumber, expiryMonth, expiryYear, cvv, cardHolder, amount } = req.body;

  // Validate fields exist
  if (!cardNumber || !expiryMonth || !expiryYear || !cvv || !cardHolder || !amount) {
    return res.status(400).json({ message: "Missing required payment fields" });
  }

  // Validate mock credit card
  const isValid = validateCard({
    cardNumber,
    expiryMonth,
    expiryYear,
    cvv,
    cardHolder,
  });

  if (!isValid) {
    return res.status(400).json({ message: "Invalid credit card information" });
  }

  // Simulate successful payment
  return res.status(200).json({
    message: "Payment successful",
    transactionId: "TXN-" + Date.now(),
    amount,
  });
});

module.exports = router;
