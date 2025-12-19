const express = require("express");
const request = require("supertest");

let mockUserRole = "customer";
let mockUserId = "user1";

jest.mock("../src/models/Order", () => ({
  findById: jest.fn(),
  find: jest.fn(),
}));

jest.mock("../src/models/Product", () => ({
  find: jest.fn(),
}));

jest.mock("../src/models/User", () => ({
  findById: jest.fn(),
}));

jest.mock("../src/services/emailService", () => ({
  sendRefundEmail: jest.fn(),
}));

jest.mock("../src/middleware/auth", () => {
  return (req, _res, next) => {
    req.user = { id: mockUserId, role: mockUserRole };
    next();
  };
});

const Order = require("../src/models/Order");
const Product = require("../src/models/Product");
const User = require("../src/models/User");
const { sendRefundEmail } = require("../src/services/emailService");
const refundRoutes = require("../src/routes/refundRoutes");

describe("Refund routes (partial)", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/refunds", refundRoutes);

    mockUserRole = "customer";
    mockUserId = "user1";
    Order.findById.mockReset();
    Order.find.mockReset();
    Product.find.mockReset();
    User.findById.mockReset();
    sendRefundEmail.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/refunds stores partial refund items and amount", async () => {
    const order = {
      id: "o1",
      userId: "user1",
      status: "delivered",
      items: [
        { productId: "p1", name: "Item 1", quantity: 2, unitPrice: 50, lineTotal: 100 },
      ],
      save: jest.fn().mockResolvedValue(),
    };
    Order.findById.mockResolvedValue(order);

    const res = await request(app)
      .post("/api/refunds")
      .send({ orderId: "o1", items: [{ productId: "p1", quantity: 1 }], reason: "damaged" });

    expect(res.statusCode).toBe(200);
    expect(order.refundRequestedItems).toHaveLength(1);
    expect(order.refundRequestedItems[0].quantity).toBe(1);
    expect(order.refundRequestAmount).toBe(50);
    expect(res.body.refundRequestAmount).toBe(50);
  });

  it("PATCH /api/refunds/:id/approve refunds selected items and restocks", async () => {
    mockUserRole = "sales_manager";

    const product = { id: "p1", stock: 3, save: jest.fn().mockResolvedValue() };
    Product.find.mockResolvedValue([product]);

    User.findById.mockResolvedValue({ id: "user1", email: "u1@test.com", username: "alice" });
    sendRefundEmail.mockResolvedValue({ skipped: false });

    const order = {
      id: "o1",
      userId: "user1",
      items: [
        { productId: "p1", name: "Item 1", quantity: 2, unitPrice: 50, lineTotal: 100 },
      ],
      refundRequestedItems: [
        { productId: "p1", name: "Item 1", quantity: 1, unitPrice: 50, lineTotal: 50 },
      ],
      refundRequestAmount: 50,
      refundRequestStatus: "pending",
      save: jest.fn().mockResolvedValue(),
    };
    Order.findById.mockResolvedValue(order);

    const res = await request(app).patch("/api/refunds/o1/approve");

    expect(res.statusCode).toBe(200);
    expect(order.refundAmount).toBe(50);
    expect(product.stock).toBe(4);
    expect(product.save).toHaveBeenCalled();
    expect(sendRefundEmail).toHaveBeenCalled();
  });
});
