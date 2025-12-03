const express = require("express");
const request = require("supertest");

// role is controlled by this mutable value in the mocked auth middleware
let mockUserRole = "customer";

// Mock orderService before requiring router
jest.mock("../src/services/orderService", () => ({
  createOrderFromCart: jest.fn(),
  getOrdersByUserId: jest.fn(),
  cancelOrder: jest.fn(),
  updateOrderStatus: jest.fn(),
  getAllDeliveries: jest.fn(),
}));

// Mock auth middleware to inject req.user.role
jest.mock("../src/middleware/auth", () => {
  return (req, _res, next) => {
    req.user = { id: "user-1", role: mockUserRole };
    next();
  };
});

const orderService = require("../src/services/orderService");
const orderRoutes = require("../src/routes/orderRoutes");

describe("Order Routes - Deliveries (Backlog 37)", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/orders", orderRoutes);
    mockUserRole = "customer";
    jest.clearAllMocks();
  });

  it("should block non product_manager roles", async () => {
    mockUserRole = "customer";

    const res = await request(app).get("/api/orders/deliveries");

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Only product managers can view deliveries");
    expect(orderService.getAllDeliveries).not.toHaveBeenCalled();
  });

  it("should return delivery list for product_manager", async () => {
    mockUserRole = "product_manager";
    orderService.getAllDeliveries.mockResolvedValue([
      {
        id: "o1",
        shippingAddress: { fullName: "Ada", addressLine1: "42 Main" },
        status: "delivered",
        completed: true,
      },
    ]);

    const res = await request(app).get("/api/orders/deliveries");

    expect(res.statusCode).toBe(200);
    expect(orderService.getAllDeliveries).toHaveBeenCalled();
    expect(Array.isArray(res.body.deliveries)).toBe(true);
    expect(res.body.deliveries[0].id).toBe("o1");
    expect(res.body.deliveries[0].completed).toBe(true);
  });

  it("should handle service errors with 500", async () => {
    mockUserRole = "product_manager";
    orderService.getAllDeliveries.mockRejectedValue(new Error("boom"));

    const res = await request(app).get("/api/orders/deliveries");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Failed to fetch deliveries");
  });
});

describe("Order Routes - Mark Delivered (Backlog 38)", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/orders", orderRoutes);
    mockUserRole = "customer";
    jest.clearAllMocks();
  });

  it("should block non product_manager roles", async () => {
    mockUserRole = "customer";

    const res = await request(app).patch("/api/orders/delivery/123");

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Only product managers can update delivery status");
    expect(orderService.updateOrderStatus).not.toHaveBeenCalled();
  });

  it("should mark order as delivered for product_manager", async () => {
    mockUserRole = "product_manager";
    orderService.updateOrderStatus.mockResolvedValue({ id: "o1", status: "delivered" });

    const res = await request(app).patch("/api/orders/delivery/o1");

    expect(orderService.updateOrderStatus).toHaveBeenCalledWith("o1", "delivered");
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Order marked as delivered");
    expect(res.body.order.status).toBe("delivered");
  });

  it("should return 404 when order is not found", async () => {
    mockUserRole = "product_manager";
    const err = new Error("not found");
    err.code = "ORDER_NOT_FOUND";
    orderService.updateOrderStatus.mockRejectedValue(err);

    const res = await request(app).patch("/api/orders/delivery/missing");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Order not found");
  });

  it("should return 500 on unexpected errors", async () => {
    mockUserRole = "product_manager";
    orderService.updateOrderStatus.mockRejectedValue(new Error("boom"));

    const res = await request(app).patch("/api/orders/delivery/o2");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Failed to update delivery status");
  });
});
