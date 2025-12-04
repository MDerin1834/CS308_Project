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

  // Helper to mock Product.find().lean()
  const mockProductQuery = (returnValue) => ({
    lean: jest.fn().mockResolvedValue(returnValue),
  });

  // Helper to mock Wishlist.findOne().lean()
  const mockWishlistQuery = (returnValue) => ({
    lean: jest.fn().mockResolvedValue(returnValue),
  });

  describe("getWishlist", () => {
    it("should return wishlist with product details", async () => {
      Wishlist.findOne.mockReturnValue(
        mockWishlistQuery({
          userId: "u1",
          items: [{ productId: "p1" }],
        })
      );

      Product.find.mockReturnValue(
        mockProductQuery([
          { id: "p1", name: "Mouse", price: 100 },
        ])
      );

      const result = await wishlistService.getWishlist("u1");

      expect(result).toHaveLength(1);
      expect(result[0].product.name).toBe("Mouse");
    });

    it("should create wishlist if none exists", async () => {
      Wishlist.findOne.mockReturnValue(
        mockWishlistQuery(null)
      );

      Wishlist.create.mockResolvedValue({
        toJSON: () => ({ userId: "u1", items: [] }),
      });

      Product.find.mockReturnValue(mockProductQuery([]));

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
      Product.findOne.mockResolvedValue({ id: "p1" });

      const saveMock = jest.fn();
      Wishlist.findOne.mockResolvedValue({
        items: [],
        save: saveMock,
      });

      const wishlist = await wishlistService.addToWishlist("u1", "p1");

      expect(saveMock).toHaveBeenCalled();
      expect(wishlist.items[0].productId).toBe("p1");
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

      expect(result.items.some(i => i.productId === "p1")).toBe(false);
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
      Wishlist.findOne.mockReturnValue(
        mockWishlistQuery({
          items: [{ productId: "p1" }, { productId: "p2" }],
        })
      );

      Product.find.mockReturnValue(
        mockProductQuery([
          {
            id: "p1",
            name: "Laptop",
            price: 900,
            originalPrice: 1000,
          },
          {
            id: "p2",
            name: "Mouse",
            price: 50,
          },
        ])
      );

      const result = await wishlistService.findDiscountedWishlistItems("u1");

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Laptop");
      expect(result[0].discountPercent).toBe(10);
    });

    it("should return empty array if wishlist empty", async () => {
      Wishlist.findOne.mockReturnValue(
        mockWishlistQuery({
          items: [],
        })
      );

      Product.find.mockReturnValue(mockProductQuery([]));

      const result = await wishlistService.findDiscountedWishlistItems("u1");

      expect(result).toEqual([]);
    });
  });
});
