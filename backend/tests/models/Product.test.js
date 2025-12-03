const Product = require("../../src/models/Product");

describe("Product Model", () => {
  it("should be invalid if required fields are missing", async () => {
    const product = new Product({});
    let err;
    try {
      await product.validate();
    } catch (error) {
      err = error;
    }
    expect(err.errors.name).toBeDefined();
    expect(err.errors.category).toBeDefined();
  });

  it("should create valid product", async () => {
    const product = new Product({
      id: "printer-123",
      category: "Electronics",
      name: "Printer",
      seller: "HP",
      price: 200,
      stock: 10,
      img: "test.jpg",
      shipping: 5
    });
    await expect(product.validate()).resolves.toBeUndefined();
  });
});
