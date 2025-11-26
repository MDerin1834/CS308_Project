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
  if (!to) {
    throw new Error("Missing recipient email");
  }

  if (!pdfBuffer) {
    throw new Error("Missing PDF buffer for invoice email");
  }

  if (!transporter) {
    console.warn("[email] SMTP settings missing; invoice email skipped");
    return { skipped: true };
  }

  const result = await transporter.sendMail({
    from: process.env.SMTP_FROM || "no-reply@teknosu.local",
    to,
    subject,
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

module.exports = {
  sendInvoiceEmail,
};
