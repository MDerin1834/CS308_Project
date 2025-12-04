const nodemailer = require("nodemailer");
const logger = require("../config/logger");

function createTransporter() {
  if (!process.env.SMTP_HOST) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
}

const transporter = createTransporter();

async function sendInvoiceEmail({ to, subject, text, pdfBuffer, fileName }) {
  if (!to) throw new Error("Missing recipient email");
  if (!pdfBuffer) throw new Error("Missing PDF buffer for invoice email");

  if (!transporter) {
    logger.warn("[email] SMTP settings missing; invoice email skipped");
    return { skipped: true };
  }

  const result = await transporter.sendMail({
    from: process.env.SMTP_FROM || "no-reply@teknosu.local",
    to,
    subject: subject || "Your Invoice",
    text: text || "Thank you for your purchase. Your invoice is attached.",
    attachments: [
      {
        filename: fileName || "invoice.pdf",
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  return { skipped: false, result };
}

async function sendRefundEmail({ to, username, orderId, amount, reason }) {
  if (!to) throw new Error("Missing recipient email");
  if (amount === undefined || amount === null) {
    throw new Error("Missing refund amount");
  }

  if (!transporter) {
    logger.warn("[email] SMTP settings missing; refund email skipped");
    return { skipped: true };
  }

  const prettyAmount = `$${Number(amount || 0).toFixed(2)}`;
  const lines = [
    `Hi ${username || "customer"},`,
    "",
    `We processed your refund for order ${orderId || ""}.`,
    `Amount: ${prettyAmount}`,
  ];

  if (reason) {
    lines.push("", `Reason: ${reason}`);
  }

  lines.push("", "The amount will appear on your statement shortly.", "", "Thank you.");

  const result = await transporter.sendMail({
    from: process.env.SMTP_FROM || "no-reply@teknosu.local",
    to,
    subject: `Refund processed for order ${orderId || ""}`,
    text: lines.join("\n"),
  });

  return { skipped: false, result };
}

async function sendWishlistDiscountEmail({ to, username, items }) {
  if (!to) throw new Error("Missing recipient email");
  if (!items || items.length === 0) return { skipped: true, reason: "no_discounted_items" };

  if (!transporter) {
    logger.warn("[email] SMTP settings missing; wishlist discount email skipped");
    return { skipped: true };
  }

  const lines = items.map(
    (item) =>
      `• ${item.name} → ${item.currentPrice} (was ${item.basePrice}, -${item.discountPercent}%)`
  );

  const textBody = [
    `Hello ${username || "customer"},`,
    "",
    "Some items in your wishlist are now discounted:",
    "",
    ...lines,
    "",
    "Don't miss the deals!",
  ].join("\n");

  const htmlBody = `
    <p>Hello <strong>${username || "customer"}</strong>,</p>
    <p>The following wishlist items are currently discounted:</p>
    <ul>
      ${items
        .map(
          (item) =>
            `<li><strong>${item.name}</strong>: ${item.currentPrice} (was ${item.basePrice}, -${item.discountPercent}%)</li>`
        )
        .join("")}
    </ul>
    <p>Don't miss the deals!</p>
  `;

  const result = await transporter.sendMail({
    from: process.env.SMTP_FROM || "no-reply@teknosu.local",
    to,
    subject: "Discounted Items in Your Wishlist",
    text: textBody,
    html: htmlBody,
  });

  return { skipped: false, result };
}

module.exports = {
  sendInvoiceEmail,
  sendRefundEmail,
  sendWishlistDiscountEmail,
};
