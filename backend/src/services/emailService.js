const nodemailer = require("nodemailer");

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
    console.warn("[email] SMTP settings missing; invoice email skipped");
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

async function sendWishlistDiscountEmail({ to, username, items }) {
  if (!to) throw new Error("Missing recipient email");
  if (!items || items.length === 0) return { skipped: true, reason: "no_discounted_items" };

  if (!transporter) {
    console.warn("[email] SMTP settings missing; wishlist discount email skipped");
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
  sendWishlistDiscountEmail,
};
