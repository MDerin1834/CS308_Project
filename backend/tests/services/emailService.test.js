// Mock nodemailer transport
const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));
jest.mock("nodemailer", () => ({
  createTransport: mockCreateTransport,
}));
const nodemailer = require("nodemailer");

const loadService = () => {
  jest.resetModules();
  // Re-require after env tweaks so transporter is recreated
  // eslint-disable-next-line global-require
  return require("../../src/services/emailService");
};

describe("emailService", () => {
  beforeEach(() => {
    mockSendMail.mockReset();
    mockCreateTransport.mockClear();
  });

  it("skips invoice email when SMTP is not configured", async () => {
    delete process.env.SMTP_HOST;
    const { sendInvoiceEmail } = loadService();

    const result = await sendInvoiceEmail({
      to: "user@example.com",
      pdfBuffer: Buffer.from("pdf"),
    });

    expect(result.skipped).toBe(true);
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("sends invoice email when SMTP is configured", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_FROM = "no-reply@example.com";
    mockSendMail.mockResolvedValueOnce({ messageId: "123" });
    const { sendInvoiceEmail } = loadService();

    const result = await sendInvoiceEmail({
      to: "user@example.com",
      subject: "Your Invoice",
      text: "Invoice attached",
      pdfBuffer: Buffer.from("pdf"),
      fileName: "invoice.pdf",
    });

    expect(result.skipped).toBe(false);
    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        from: "no-reply@example.com",
        subject: "Your Invoice",
      })
    );
    const attachmentArg = mockSendMail.mock.calls[0][0].attachments[0];
    expect(attachmentArg.filename).toBe("invoice.pdf");
  });

  it("sends refund email when SMTP is configured", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_FROM = "no-reply@example.com";
    mockSendMail.mockResolvedValueOnce({ messageId: "456" });
    const { sendRefundEmail } = loadService();

    const result = await sendRefundEmail({
      to: "user@example.com",
      username: "alice",
      orderId: "order123",
      amount: 25.5,
      reason: "Item damaged",
    });

    expect(result.skipped).toBe(false);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: "Refund processed for order order123",
      })
    );
  });
});
