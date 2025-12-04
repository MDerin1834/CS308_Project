const express = require("express");
const request = require("supertest");

let mockUserRole = "customer";

// Mock auth to inject a controllable role
jest.mock("../src/middleware/auth", () => {
  return (req, _res, next) => {
    req.user = { id: "user-1", role: mockUserRole };
    next();
  };
});

// Mock order service
jest.mock("../src/services/orderService", () => ({
  getDeliveryList: jest.fn(),
  updateOrderStatus: jest.fn(),
}));

const orderService = require("../src/services/orderService");
const orderRoutes = require("../src/routes/orderRoutes");
const deliveryRoutes = require("../src/routes/deliveryRoutes");

describe("Order Routes - Backlog 37 Deliveries", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/orders", orderRoutes);
    app.use("/api/delivery", deliveryRoutes);
    mockUserRole = "customer";
    jest.clearAllMocks();
  });

  it("GET /api/orders/deliveries should return 403 for non product_manager", async () => {
    mockUserRole = "customer";

    const res = await request(app).get("/api/orders/deliveries");

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Only product managers can view deliveries");
    expect(orderService.getDeliveryList).not.toHaveBeenCalled();
  });

  it("GET /api/orders/deliveries should return delivery list for product_manager", async () => {
    mockUserRole = "product_manager";
    const mockDeliveries = [
      {
        id: "order-1",
        shippingAddress: { fullName: "Jane Doe", addressLine1: "123 St", city: "NY" },
        status: "delivered",
        completion: true,
      },
    ];
    orderService.getDeliveryList.mockResolvedValue(mockDeliveries);

    const res = await request(app).get("/api/orders/deliveries");

    expect(res.statusCode).toBe(200);
    expect(orderService.getDeliveryList).toHaveBeenCalled();
    expect(res.body.deliveries).toEqual(mockDeliveries);
  });

  it("PATCH /api/delivery/:id should return 403 for non product_manager", async () => {
    mockUserRole = "customer";

    const res = await request(app).patch("/api/delivery/ord-1");

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Only product managers can update deliveries");
    expect(orderService.updateOrderStatus).not.toHaveBeenCalled();
  });

  it("PATCH /api/delivery/:id should mark order as delivered for product_manager", async () => {
    mockUserRole = "product_manager";
    const mockOrder = { id: "ord-1", status: "delivered" };
    orderService.updateOrderStatus.mockResolvedValue(mockOrder);

    const res = await request(app).patch("/api/delivery/ord-1");

    expect(orderService.updateOrderStatus).toHaveBeenCalledWith("ord-1", "delivered");
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Order marked as delivered");
    expect(res.body.order).toEqual(mockOrder);
  });

  it("PATCH /api/delivery/:id should return 404 when order not found", async () => {
    mockUserRole = "product_manager";
    const err = new Error("not found");
    err.code = "ORDER_NOT_FOUND";
    orderService.updateOrderStatus.mockRejectedValue(err);

    const res = await request(app).patch("/api/delivery/missing");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Order not found");
  });
});
