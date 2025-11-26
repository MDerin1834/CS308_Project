const orderService = require("../services/orderService");

/**
 * POST /api/orders
 * Body:
 * {
 *   shippingAddress: {
 *     fullName, addressLine1, addressLine2?, city, country, postalCode, phone?
 *   },
 *   notes?: string
 * }
 */
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id; // cartController ile aynı mantık

    const order = await orderService.createOrderFromCart(userId, req.body);

    return res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (err) {
    console.error("❌ createOrder error:", err);

    if (err.code === "EMPTY_CART") {
      return res.status(400).json({ message: "Cart is empty" });
    }
    if (err.code === "INVALID_ADDRESS") {
      return res.status(400).json({ message: "Invalid or missing shipping address" });
    }
    if (err.code === "INSUFFICIENT_STOCK") {
      return res.status(409).json({
        message: "Insufficient stock for some items",
        productId: err.productId,
        available: err.available,
      });
    }
    if (err.code === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({
        message: "One of the products in the cart no longer exists",
        productId: err.productId,
      });
    }

    return res.status(500).json({ message: "Failed to create order" });
  }
};

/**
 * GET /api/orders/my-orders
 
 */
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id; // auth middleware'den geliyor

    const orders = await orderService.getOrdersByUserId(userId);

    return res.status(200).json({
      message: "Orders fetched successfully",
      orders,
    });
  } catch (err) {
    console.error("❌ getMyOrders error:", err);
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
};
