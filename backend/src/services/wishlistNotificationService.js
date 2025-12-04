const User = require("../models/User");
const { findDiscountedWishlistItems } = require("./wishlistService");
const { sendWishlistDiscountEmail } = require("./emailService");

async function notifyUserForWishlistDiscounts(userId) {
  const user = await User.findById(userId).lean();
  if (!user || !user.email) {
    const err = new Error("User or email not found");
    err.code = "NO_EMAIL";
    throw err;
  }

  const discountedItems = await findDiscountedWishlistItems(userId);
  if (!discountedItems.length) {
    return { sent: false, count: 0 };
  }

  const result = await sendWishlistDiscountEmail({
    to: user.email,
    username: user.username || user.name || user.email,
    items: discountedItems,
  });

  return {
    sent: true,
    count: discountedItems.length,
    emailResult: result,
  };
}

module.exports = {
  notifyUserForWishlistDiscounts,
};
