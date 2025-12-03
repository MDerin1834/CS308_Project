const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order");

const VALID_STATUSES = ["processing", "paid", "cancelled", "in-transit", "delivered"];

/**
 * #25: Kullanıcının sepetinden order oluşturur.
 * - Sepeti okur
 * - Stok kontrolü yapar
 * - Order oluşturur
 * - Ürün stoklarını düşürür
 * - Sepeti temizler
 */
async function createOrderFromCart(userId, payload) {
  // 1) Sepeti bul
  const cart = await Cart.findOne({ userId });
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    const err = new Error("Cart is empty");
    err.code = "EMPTY_CART";
    throw err;
  }

  // 2) Ürünleri çek
  const productIds = cart.items.map((it) => it.productId);
  const products = await Product.find({ id: { $in: productIds } });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // 3) Her item için stok ve ürün doğrulaması
  const orderItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      const err = new Error("Product not found: " + item.productId);
      err.code = "PRODUCT_NOT_FOUND";
      err.productId = item.productId;
      throw err;
    }

    const quantity = item.quantity || 0;
    const availableStock = product.stock ?? 0;

    if (availableStock < quantity) {
      const err = new Error("Insufficient stock for " + item.productId);
      err.code = "INSUFFICIENT_STOCK";
      err.productId = item.productId;
      err.available = availableStock;
      throw err;
    }

    const unitPrice = item.priceSnapshot ?? product.price;
    const lineTotal = unitPrice * quantity;
    subtotal += lineTotal;

    orderItems.push({
      productId: item.productId,
      name: product.name,
      imageURL: product.imageURL || product.img || "",
      quantity,
      unitPrice,
      lineTotal,
    });
  }

  // 4) Vergi / kargo (şimdilik basit)
  const tax = 0;
  const shipping = 0;
  const total = subtotal + tax + shipping;

  // 5) Gönderi adresi payload'dan gelsin
  const shippingAddress = payload?.shippingAddress;
  if (
    !shippingAddress ||
    !shippingAddress.fullName ||
    !shippingAddress.addressLine1 ||
    !shippingAddress.city ||
    !shippingAddress.country ||
    !shippingAddress.postalCode
  ) {
    const err = new Error("Shipping address is incomplete");
    err.code = "INVALID_ADDRESS";
    throw err;
  }

  // 6) Stok düş
  for (const item of cart.items) {
    const product = productMap.get(item.productId);
    product.stock = (product.stock ?? 0) - item.quantity;
    if (product.stock < 0) product.stock = 0;
  }
  await Promise.all(products.map((p) => p.save()));

  // 7) Order oluştur
  const order = await Order.create({
    userId,
    items: orderItems,
    subtotal,
    tax,
    shipping,
    total,
    status: "processing",
    shippingAddress,
    notes: payload?.notes || "",
  });

  // 8) Sepeti temizle
  cart.items = [];
  await cart.save();

  return order.toJSON();
}

/**
 * #28: Belirli kullanıcıya ait tüm siparişleri getirir.
 * - userId ile filtreler
 * - en yeni siparişi en üstte döner
 */
async function getOrdersByUserId(userId) {
  return Order.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
}

async function cancelOrder(orderId, userId) {
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error("Order not found");
    err.code = "ORDER_NOT_FOUND";
    throw err;
  }

  // Sipariş bu kullanıcıya mı ait?
  if (String(order.userId) !== String(userId)) {
    const err = new Error("Not your order");
    err.code = "NOT_YOUR_ORDER";
    throw err;
  }

  // Sadece "processing" status'ü iptal edilebilir
  if (order.status !== "processing") {
    const err = new Error("Order cannot be cancelled");
    err.code = "NOT_CANCELLABLE";
    throw err;
  }

  order.status = "cancelled";
  await order.save();

  return order.toJSON();
}

async function updateOrderStatus(orderId, newStatus) {
  if (!VALID_STATUSES.includes(newStatus)) {
    const err = new Error("Invalid order status");
    err.code = "INVALID_STATUS";
    throw err;
  }

  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error("Order not found");
    err.code = "ORDER_NOT_FOUND";
    throw err;
  }

  order.status = newStatus;
  await order.save();

  return order.toJSON();
}

module.exports = {
  createOrderFromCart,
  getOrdersByUserId,
  cancelOrder,
  updateOrderStatus,
};
