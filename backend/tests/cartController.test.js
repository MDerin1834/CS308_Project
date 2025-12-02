const cartController = require("../src/controllers/cartController");

jest.mock("../src/models/Product", () => ({
  findOne: jest.fn(),
  find: jest.fn(),
}));

jest.mock("../src/models/Cart", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

const Product = require("../src/models/Product");
const Cart = require("../src/models/Cart");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("cartController.addOrUpdateItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 409 when requested quantity exceeds stock", async () => {
    Product.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ id: "p1", stock: 1, price: 100 }),
    });
    Cart.findOne.mockResolvedValue({ items: [], save: jest.fn() });

    const req = { body: { productId: "p1", quantity: 5 }, user: { id: "u1" } };
    const res = mockRes();

    await cartController.addOrUpdateItem(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: "Insufficient stock",
      available: 1,
    });
  });

  it("should create cart entry when stock is sufficient", async () => {
    Product.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ id: "p1", stock: 3, price: 50 }),
    });

    const mockCart = { items: [], save: jest.fn() };

    // first call from addOrUpdateItem -> null -> triggers Cart.create
    Cart.findOne
      .mockResolvedValueOnce(null) // addOrUpdateItem first lookup
      // second call comes from getCart inside controller; needs lean()
      .mockReturnValueOnce({
        items: [{ productId: "p1", quantity: 2, priceSnapshot: 50 }],
        lean: jest.fn().mockResolvedValue({
          items: [{ productId: "p1", quantity: 2, priceSnapshot: 50 }],
        }),
      });
    Cart.create.mockResolvedValueOnce(mockCart);

    Product.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { id: "p1", name: "Test", price: 50, stock: 3, imageURL: "" },
      ]),
    });

    const req = { body: { productId: "p1", quantity: 2 }, user: { id: "u1" } };
    const res = mockRes();

    await cartController.addOrUpdateItem(req, res);

    expect(mockCart.save).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.items[0].productId).toBe("p1");
    expect(body.subtotal).toBe(100);
  });
});
