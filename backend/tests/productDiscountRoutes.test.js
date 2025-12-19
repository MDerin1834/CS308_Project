const express = require("express");
const request = require("supertest");

let mockUserRole = "customer";

jest.mock("../src/models/Product", () => ({
  findOne: jest.fn(),
}));

jest.mock("../src/models/Wishlist", () => ({
  find: jest.fn(),
}));

jest.mock("../src/models/User", () => ({
  find: jest.fn(),
}));

jest.mock("../src/services/emailService", () => ({
  sendWishlistDiscountEmail: jest.fn(),
}));

jest.mock("../src/middleware/auth", () => {
  return (req, _res, next) => {
    req.user = { id: "test-user", role: mockUserRole };
    next();
  };
});

const Product = require("../src/models/Product");
const Wishlist = require("../src/models/Wishlist");
const User = require("../src/models/User");
const { sendWishlistDiscountEmail } = require("../src/services/emailService");
const productRoutes = require("../src/routes/productRoutes");

describe("Product discount routes", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/products", productRoutes);

    mockUserRole = "sales_manager";
    Product.findOne.mockReset();
    Wishlist.find.mockReset();
    User.find.mockReset();
    sendWishlistDiscountEmail.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("PATCH /api/products/:id/discount applies discount and notifies wishlist users", async () => {
    const product = {
      id: "p1",
      name: "Mouse",
      price: 100,
      originalPrice: null,
      save: jest.fn().mockResolvedValue(),
    };
    Product.findOne.mockResolvedValue(product);

    Wishlist.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([{ userId: "u1" }]),
    });

    User.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([{ _id: "u1", email: "u1@test.com", username: "alice" }]),
    });

    sendWishlistDiscountEmail.mockResolvedValue({ skipped: false });

    const res = await request(app)
      .patch("/api/products/p1/discount")
      .send({ discountPercent: 20 });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Discount applied");
    expect(product.discountPercent).toBe(20);
    expect(product.discountPrice).toBe(80);
    expect(sendWishlistDiscountEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "u1@test.com",
        items: [
          expect.objectContaining({
            productId: "p1",
            name: "Mouse",
            currentPrice: 80,
            basePrice: 100,
            discountPercent: 20,
          }),
        ],
      })
    );
  });

  it("PATCH /api/products/:id/discount clears discount", async () => {
    const product = {
      id: "p1",
      name: "Mouse",
      price: 80,
      originalPrice: 100,
      discountPrice: 80,
      discountPercent: 20,
      save: jest.fn().mockResolvedValue(),
    };
    Product.findOne.mockResolvedValue(product);

    const res = await request(app)
      .patch("/api/products/p1/discount")
      .send({ clear: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Discount cleared");
    expect(product.price).toBe(100);
    expect(product.discountPrice).toBeNull();
    expect(product.discountPercent).toBeNull();
  });
});
