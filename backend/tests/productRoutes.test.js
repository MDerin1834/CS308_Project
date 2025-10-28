const express = require("express");
const request = require("supertest");
const productRoutes = require("../src/routes/productRoutes");
const Product = require("../src/models/Product");

// Mock Product.find ve findOne
jest.mock("../src/models/Product");

describe("Product Routes", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use("/api/products", productRoutes);
  });

  it("GET /api/products should return all products", async () => {
    Product.find.mockResolvedValue([{ name: "Mouse" }, { name: "Keyboard" }]);
    const res = await request(app).get("/api/products");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it("GET /api/products/:id should return product if exists", async () => {
    Product.findOne.mockResolvedValue({ id: "p1", name: "Monitor" });
    const res = await request(app).get("/api/products/p1");
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Monitor");
  });

  it("GET /api/products/:id should return 404 if not found", async () => {
    Product.findOne.mockResolvedValue(null);
    const res = await request(app).get("/api/products/unknown");
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Product not found");
  });
});
