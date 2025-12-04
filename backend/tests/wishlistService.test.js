const wishlistService = require("../src/services/wishlistService");

// Mock models
jest.mock("../src/models/Wishlist", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));
jest.mock("../src/models/Product", () => ({
  find: jest.fn(),
  findOne: jest.fn(),
}));

const Wishlist = require("../src/models/Wishlist");
const Product = require("../src/models/Product");

describe("wishlistService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getWishlist", () => {
    it("should return wishlist with product details", async () => {
      Wishlist.findOne.mockResolvedValue({
        userId: "u1",
        items: [{ productId: "p1" }],
      });

      Product.find.mockResolvedValue([
        { id: "p1", name: "Mouse", price: 100 },
      ]);

      const result = await wishlistService.getWishlist("u1");

      expect(result).toHaveLength(1);
      expect(result[0].product.name).toBe("Mouse");
    });

    it("should create wishlist if none exists", async () => {
      Wishlist.findOne.mockResolvedValue(null);

      Wishlist.create.mockResolvedValue({
        toJSON: () => ({ userId: "u1", items: [] }),
      });

      Product.find.mockResolvedValue([]);

      const result = await wishlistService.getWishlist("u1");

      expect(Wishlist.create).toHaveBeenCalledWith({
        userId: "u1",
        items: [],
      });
      expect(result).toEqual([]);
    });
  });

  describe("addToWishlist", () => {
    it("should add product if not exists", async () => {
      Product.findOne.mockResolvedValue({ id: "p1" }); // product exists
      Wishlist.findOne.mockResolvedValue({
        items: [],
        save: jest.fn(),
      });

      const wishlist = await wishlistService.addToWishlist("u1", "p1");

      expect(wishlist.save).toHaveBeenCalled();
    });

    it("should throw if product not found", async () => {
      Product.findOne.mockResolvedValue(null);

      await expect(
        wishlistService.addToWishlist("u1", "pX")
      ).rejects.toThrow("Product not found");
    });

    it("should throw if product already in wishlist", async () => {
      Product.findOne.mockResolvedValue({ id: "p1" });

      Wishlist.findOne.mockResolvedValue({
        items: [{ productId: "p1" }],
      });

      await expect(
        wishlistService.addToWishlist("u1", "p1")
      ).rejects.toThrow("Already in wishlist");
    });
  });

  describe("removeFromWishlist", () => {
    it("should remove product from wishlist", async () => {
      const saveMock = jest.fn();

      Wishlist.findOne.mockResolvedValue({
        items: [{ productId: "p1" }, { productId: "p2" }],
        save: saveMock,
      });

      const result = await wishlistService.removeFromWishlist("u1", "p1");

      expect(result.items.some((i) => i.productId === "p1")).toBe(false);
      expect(saveMock).toHaveBeenCalled();
    });

    it("should throw if wishlist not found", async () => {
      Wishlist.findOne.mockResolvedValue(null);

      await expect(
        wishlistService.removeFromWishlist("u1", "p1")
      ).rejects.toThrow("Wishlist not found");
    });
  });

  describe("findDiscountedWishlistItems", () => {
    it("should return discounted items only", async () => {
      Wishlist.findOne.mockResolvedValue({
        items: [{ productId: "p1" }, { productId: "p2" }],
      });

      Product.find.mockResolvedValue([
        { id: "p1", name: "Laptop", price: 900, originalPrice: 1000 }, // discounted
        { id: "p2", name: "Mouse", price: 50 }, // no discount
      ]);

      const result = await wishlistService.findDiscountedWishlistItems("u1");

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Laptop");
      expect(result[0].discountPercent).toBe(10);
    });

    it("should return empty array if wishlist empty", async () => {
      Wishlist.findOne.mockResolvedValue({
        items: [],
      });

      const result = await wishlistService.findDiscountedWishlistItems("u1");

      expect(result).toEqual([]);
    });
  });
});
