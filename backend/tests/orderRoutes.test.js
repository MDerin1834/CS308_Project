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
}));

const orderService = require("../src/services/orderService");
const orderRoutes = require("../src/routes/orderRoutes");

describe("Order Routes - Backlog 37 Deliveries", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/orders", orderRoutes);
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
});
