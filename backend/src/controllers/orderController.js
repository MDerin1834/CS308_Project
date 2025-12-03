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

exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const order = await orderService.cancelOrder(orderId, userId);

    return res.status(200).json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (err) {
    console.error("❌ cancelOrder error:", err);

    if (err.code === "ORDER_NOT_FOUND") {
      return res.status(404).json({ message: "Order not found" });
    }
    if (err.code === "NOT_YOUR_ORDER") {
      return res.status(403).json({ message: "You cannot cancel this order" });
    }
    if (err.code === "NOT_CANCELLABLE") {
      return res.status(400).json({ message: "Order cannot be cancelled" });
    }

    return res.status(500).json({ message: "Failed to cancel order" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const userRole = req.user.role;
    const orderId = req.params.id;
    const { status } = req.body;

    if (userRole !== "product_manager") {
      return res.status(403).json({ message: "Only product managers can update status" });
    }

    const order = await orderService.updateOrderStatus(orderId, status);

    return res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (err) {
    console.error("❌ updateOrderStatus error:", err);

    if (err.code === "ORDER_NOT_FOUND") {
      return res.status(404).json({ message: "Order not found" });
    }
    if (err.code === "INVALID_STATUS") {
      return res.status(400).json({ message: "Invalid order status" });
    }

    return res.status(500).json({ message: "Failed to update order status" });
  }
};
