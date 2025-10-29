const express = require("express");
const request = require("supertest");
const productRoutes = require("../src/routes/productRoutes");
const Product = require("../src/models/Product");

// ✅ Mock the Product model
jest.mock("../src/models/Product");

describe("Product Routes", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use("/api/products", productRoutes);
  });

  // ✅ Test: Get all products
  it("GET /api/products should return all products", async () => {
    Product.find.mockResolvedValue([{ name: "Mouse" }, { name: "Keyboard" }]);
    const res = await request(app).get("/api/products");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  // ✅ Test: Filter by category
  it("GET /api/products?category=electronics should filter by category", async () => {
    Product.find.mockResolvedValue([{ name: "Monitor", category: "electronics" }]);
    const res = await request(app).get("/api/products?category=electronics");

    expect(Product.find).toHaveBeenCalledWith({
      category: { $regex: "electronics", $options: "i" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body[0].category).toBe("electronics");
  });

  // ✅ Test: Search by name or description
  it("GET /api/products?search=keyboard should search by name or description", async () => {
    Product.find.mockResolvedValue([{ name: "Keyboard", description: "Mechanical keyboard" }]);
    const res = await request(app).get("/api/products?search=keyboard");

    expect(Product.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: "keyboard", $options: "i" } },
        { description: { $regex: "keyboard", $options: "i" } },
      ],
    });
    expect(res.statusCode).toBe(200);
    expect(res.body[0].name).toBe("Keyboard");
  });

  // ✅ Test: Combined search and category filter
  it("GET /api/products?category=electronics&search=laptop should apply both filters", async () => {
    Product.find.mockResolvedValue([
      { name: "Gaming Laptop", category: "electronics" },
    ]);

    const res = await request(app).get(
      "/api/products?category=electronics&search=laptop"
    );

    expect(Product.find).toHaveBeenCalledWith({
      category: { $regex: "electronics", $options: "i" },
      $or: [
        { name: { $regex: "laptop", $options: "i" } },
        { description: { $regex: "laptop", $options: "i" } },
      ],
    });
    expect(res.statusCode).toBe(200);
    expect(res.body[0].name).toBe("Gaming Laptop");
  });

  // ✅ Test: Get product by ID
  it("GET /api/products/:id should return product if exists", async () => {
    Product.findOne.mockResolvedValue({ id: "p1", name: "Monitor" });
    const res = await request(app).get("/api/products/p1");

    expect(Product.findOne).toHaveBeenCalledWith({ id: "p1" });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Monitor");
  });

  // ✅ Test: Return 404 if product not found
  it("GET /api/products/:id should return 404 if not found", async () => {
    Product.findOne.mockResolvedValue(null);
    const res = await request(app).get("/api/products/unknown");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Product not found");
  });
});
