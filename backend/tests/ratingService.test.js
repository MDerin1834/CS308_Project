const ratingService = require("../src/services/ratingService");

jest.mock("../src/models/Rating", () => ({
  find: jest.fn(),
  create: jest.fn(),
}));

jest.mock("../src/models/Order", () => ({
  find: jest.fn(),
}));

jest.mock("../src/models/Product", () => ({
  findOne: jest.fn(),
}));

const Rating = require("../src/models/Rating");
const Order = require("../src/models/Order");
const Product = require("../src/models/Product");

describe("ratingService.addRating", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reject if product was not delivered", async () => {
    Product.findOne.mockResolvedValue({ id: "p1" });
    Order.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });

    await expect(ratingService.addRating("u1", "p1", 5)).rejects.toMatchObject({
      code: "NOT_DELIVERED",
    });
  });

  it("should create rating and update product averages when delivered", async () => {
    const mockProduct = {
      id: "p1",
      ratings: 4,
      ratingsCount: 2,
      save: jest.fn(),
      toJSON: function () {
        return {
          id: this.id,
          ratings: this.ratings,
          ratingsCount: this.ratingsCount,
        };
      },
    };

    Product.findOne.mockResolvedValue(mockProduct);
    Order.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ _id: "o1" }]),
    });
    Rating.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    });
    Rating.create.mockResolvedValue({
      toJSON: () => ({ id: "r1", rating: 5 }),
    });

    const result = await ratingService.addRating("u1", "p1", 5);

    expect(Rating.create).toHaveBeenCalledWith({
      userId: "u1",
      productId: "p1",
      rating: 5,
      orderId: "o1",
    });
    expect(mockProduct.ratingsCount).toBe(3);
    expect(mockProduct.ratings).toBeCloseTo((4 * 2 + 5) / 3);
    expect(mockProduct.save).toHaveBeenCalled();
    expect(result.rating.id).toBe("r1");
  });
});
