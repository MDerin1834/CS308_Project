const express = require("express");
const request = require("supertest");

// 🔹 auth için role'ü dışarıdan değiştirebilmek adına global değişken
let mockUserRole = "customer";

// 🔹 ÖNCE mock, SONRA require – çok önemli
jest.mock("../src/models/Product", () => {
  const m = {
    find: jest.fn(),
    countDocuments: jest.fn(),
    findOne: jest.fn(),
    findOneAndDelete: jest.fn(),
  };
  return m;
});

// 🔹 auth middleware'i mockla: req.user.role = mockUserRole
jest.mock("../src/middleware/auth", () => {
  return (req, _res, next) => {
    req.user = { id: "test-user", role: mockUserRole };
    next();
  };
});

const Product = require("../src/models/Product");
const productRoutes = require("../src/routes/productRoutes");

describe("Product Routes", () => {
  let app;
  let query;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/products", productRoutes);

    // find() için chainable query mock'u
    query = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn(),
    };

    Product.find.mockReturnValue(query);
    Product.find.mockClear();
    Product.countDocuments.mockClear();
    Product.findOne.mockClear();
    Product.findOneAndDelete.mockClear();

    // varsayılan rol: customer
    mockUserRole = "customer";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ✅ GET /api/products — basic list + meta
  it("GET /api/products should return items and meta", async () => {
    query.lean.mockResolvedValue([
      { id: "p1", name: "Mouse", stock: 5 },
      { id: "p2", name: "Keyboard", stock: 0 },
    ]);
    Product.countDocuments.mockResolvedValue(2);

    const res = await request(app).get("/api/products");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.items[0].name).toBe("Mouse");
    expect(res.body.items[0].stockStatus).toBe("in_stock");
    expect(res.body.items[1].stockStatus).toBe("out_of_stock");
    expect(res.body.meta.total).toBe(2);
    expect(res.body.meta.page).toBe(1);
  });

  // ✅ GET /api/products?category=&search= → filter check
  it("GET /api/products should apply category and search filter", async () => {
    query.lean.mockResolvedValue([
      { id: "p1", name: "Gaming Laptop", category: "electronics", stock: 3 },
    ]);
    Product.countDocuments.mockResolvedValue(1);

    const res = await request(app).get(
      "/api/products?category=electronics&search=laptop"
    );

    // filter nesnesi productRoutes'taki mantığa göre
    expect(Product.find).toHaveBeenCalledWith({
      category: { $regex: "electronics", $options: "i" },
      $or: [
        { name: { $regex: "laptop", $options: "i" } },
        { seller: { $regex: "laptop", $options: "i" } },
      ],
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.items[0].name).toBe("Gaming Laptop");
  });

  // ✅ GET /api/products/:id → product exists
  it("GET /api/products/:id should return product if exists", async () => {
    Product.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        id: "p1",
        name: "Monitor",
        stock: 10,
      }),
    });

    const res = await request(app).get("/api/products/p1");

    expect(Product.findOne).toHaveBeenCalledWith({ id: "p1" });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Monitor");
    expect(res.body.stockStatus).toBe("in_stock");
  });

  // ✅ GET /api/products/:id → 404 if not found
  it("GET /api/products/:id should return 404 if not found", async () => {
    Product.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app).get("/api/products/unknown");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Product not found");
  });

  //
  // 🔻 BACKLOG 35 TESTLERİ: DELETE /api/products/:id
  //

  // ❌ customer rolü → 403
  it("DELETE /api/products/:id should return 403 for non product_manager", async () => {
    mockUserRole = "customer"; // varsayılan zaten bu, ama açık yazalım

    const res = await request(app).delete("/api/products/p1");

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Only product managers can manage products");
    expect(Product.findOneAndDelete).not.toHaveBeenCalled();
  });

  // ✅ product_manager rolü + product exists → 200 + deleted product
  it("DELETE /api/products/:id should delete and return product for product_manager", async () => {
    mockUserRole = "product_manager";

    Product.findOneAndDelete.mockResolvedValue({
      id: "p1",
      name: "Test Product",
    });

    const res = await request(app).delete("/api/products/p1");

    expect(Product.findOneAndDelete).toHaveBeenCalledWith({ id: "p1" });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Product deleted successfully");
    expect(res.body.product.id).toBe("p1");
  });

  // ✅ product_manager rolü + product not found → 404
  it("DELETE /api/products/:id should return 404 if product does not exist", async () => {
    mockUserRole = "product_manager";

    Product.findOneAndDelete.mockResolvedValue(null);

    const res = await request(app).delete("/api/products/unknown");

    expect(Product.findOneAndDelete).toHaveBeenCalledWith({ id: "unknown" });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Product not found");
  });
});
