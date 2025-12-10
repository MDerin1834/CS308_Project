const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");

// Mocks
let mockUserId = "";
jest.mock("../../src/middleware/auth", () => {
  return (req, _res, next) => {
    req.user = { id: mockUserId, role: "customer" };
    next();
  };
});

const mockSendInvoiceEmail = jest.fn().mockResolvedValue({ skipped: false });
jest.mock("../../src/services/emailService", () => ({
  sendInvoiceEmail: (...args) => mockSendInvoiceEmail(...args),
  sendRefundEmail: jest.fn(),
}));

// App + models
const orderRoutes = require("../../src/routes/orderRoutes");
const paymentRoutes = require("../../src/routes/paymentRoutes");
const Cart = require("../../src/models/Cart");
const Product = require("../../src/models/Product");
const Order = require("../../src/models/Order");
const User = require("../../src/models/User");

describe("Checkout integration (order + payment)", () => {
  let app;
  let mongo;

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    mongo = await MongoMemoryServer.create({
      instance: { ip: "127.0.0.1", bindIp: "127.0.0.1", port: 27018 },
    });
    await mongoose.connect(mongo.getUri(), { dbName: "checkout-tests" });
  });

  beforeEach(async () => {
    mockUserId = new mongoose.Types.ObjectId().toString();
    app = express();
    app.use(express.json());
    app.use("/api/orders", orderRoutes);
    app.use("/api/payment", paymentRoutes);

    await mongoose.connection.db.dropDatabase();

    // Seed a user for payment route lookups
    await User.create({
      _id: mockUserId,
      username: "alice",
      email: "alice@example.com",
      password: "hashed",
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) {
      await mongo.stop();
    }
  });

  it("creates an order from cart and clears cart while reducing stock", async () => {
    await Product.create({
      id: "p1",
      name: "Product 1",
      price: 50,
      stock: 5,
      category: "Test",
      seller: "TestSeller",
    });
    await Cart.create({
      userId: mockUserId,
      items: [{ productId: "p1", quantity: 2, priceSnapshot: 50 }],
    });

    const res = await request(app).post("/api/orders").send({
      shippingAddress: {
        fullName: "Alice",
        addressLine1: "123 St",
        city: "NY",
        country: "US",
        postalCode: "10001",
      },
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.order.items).toHaveLength(1);
    expect(res.body.order.total).toBe(100);

    const cart = await Cart.findOne({ userId: mockUserId }).lean();
    expect(cart.items).toHaveLength(1);

    const product = await Product.findOne({ id: "p1" }).lean();
    expect(product.stock).toBe(3);
  });

  it("processes payment, marks order paid, and returns invoice metadata", async () => {
    await Product.create({
      id: "p2",
      name: "Product 2",
      price: 30,
      stock: 4,
      category: "Test",
      seller: "TestSeller",
    });
    await Cart.create({
      userId: mockUserId,
      items: [{ productId: "p2", quantity: 1, priceSnapshot: 30 }],
    });

    // First create an order
    const orderRes = await request(app).post("/api/orders").send({
      shippingAddress: {
        fullName: "Alice",
        addressLine1: "123 St",
        city: "NY",
        country: "US",
        postalCode: "10001",
      },
    });
    const orderId = orderRes.body.order.id;

    const payRes = await request(app).post("/api/payment/checkout").send({
      orderId,
      amount: 30,
      cardNumber: "4111111111111111",
      expiryMonth: "12",
      expiryYear: String(new Date().getFullYear() + 1),
      cvv: "123",
      cardHolder: "Alice Doe",
    });

    expect(payRes.statusCode).toBe(200);
    expect(payRes.body.invoiceNumber).toBeDefined();
    expect(payRes.body.emailSent).toBe(true);
    expect(mockSendInvoiceEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alice@example.com",
      })
    );

    const updatedOrder = await Order.findById(orderId).lean();
    expect(updatedOrder.status).toBe("paid");
    expect(updatedOrder.paidAt).toBeTruthy();
    expect(updatedOrder.invoiceNumber).toBeTruthy();

    const cart = await Cart.findOne({ userId: mockUserId }).lean();
    expect(cart.items).toHaveLength(0);
  });
});
