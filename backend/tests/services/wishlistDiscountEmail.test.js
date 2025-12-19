const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));

jest.mock("nodemailer", () => ({
  createTransport: mockCreateTransport,
}));

const loadService = () => {
  jest.resetModules();
  // eslint-disable-next-line global-require
  return require("../../src/services/emailService");
};

describe("sendWishlistDiscountEmail", () => {
  beforeEach(() => {
    mockSendMail.mockReset();
    mockCreateTransport.mockClear();
  });

  it("skips wishlist email when SMTP is not configured", async () => {
    delete process.env.SMTP_HOST;
    const { sendWishlistDiscountEmail } = loadService();

    const result = await sendWishlistDiscountEmail({
      to: "user@example.com",
      items: [{ name: "Mouse", currentPrice: 80, basePrice: 100, discountPercent: 20 }],
    });

    expect(result.skipped).toBe(true);
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("sends wishlist discount email with subject and content", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_FROM = "no-reply@example.com";
    mockSendMail.mockResolvedValueOnce({ messageId: "789" });
    const { sendWishlistDiscountEmail } = loadService();

    const result = await sendWishlistDiscountEmail({
      to: "user@example.com",
      username: "alice",
      items: [{ name: "Mouse", currentPrice: 80, basePrice: 100, discountPercent: 20 }],
    });

    expect(result.skipped).toBe(false);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: "Discounted Items in Your Wishlist",
      })
    );
    const args = mockSendMail.mock.calls[0][0];
    expect(args.text).toContain("Mouse");
    expect(args.html).toContain("Mouse");
  });
});
