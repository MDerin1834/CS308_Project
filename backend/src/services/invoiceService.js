const PDFDocument = require("pdfkit");
const Order = require("../models/Order"); 

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `$${amount.toFixed(2)}`;
}

function buildInvoiceNumber(orderId) {
  const suffix = String(orderId || "")
    .slice(-6)
    .toUpperCase()
    .padStart(6, "0");
  return `INV-${suffix}`;
}

function generateInvoicePdf({ order, user }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    const invoiceNumber =
      order.invoiceNumber || buildInvoiceNumber(order.id || order._id);
    const paidDate = order.paidAt ? new Date(order.paidAt) : new Date();

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () =>
      resolve({ buffer: Buffer.concat(chunks), invoiceNumber })
    );
    doc.on("error", reject);

    doc.fontSize(20).text("Invoice", { align: "right" });
    doc.moveDown();

    doc.fontSize(12).text(`Invoice No: ${invoiceNumber}`);
    doc.text(`Order ID: ${order.id || order._id}`);
    doc.text(`Date: ${paidDate.toISOString().split("T")[0]}`);
    doc.text(
      `Customer: ${
        user?.username ||
        order.shippingAddress?.fullName ||
        "Customer"
      }`
    );
    doc.moveDown();

    doc.fontSize(14).text("Billed To");
    doc.fontSize(12).text(order.shippingAddress?.fullName || "");
    doc.text(order.shippingAddress?.addressLine1 || "");
    if (order.shippingAddress?.addressLine2)
      doc.text(order.shippingAddress.addressLine2);
    doc.text(
      `${order.shippingAddress?.city || ""}, ${
        order.shippingAddress?.country || ""
      } ${order.shippingAddress?.postalCode || ""}`
    );
    if (order.shippingAddress?.phone)
      doc.text(`Phone: ${order.shippingAddress.phone}`);
    doc.moveDown();

    doc.fontSize(14).text("Items");
    doc.moveDown(0.5);

    order.items?.forEach((item) => {
      doc.fontSize(12).text(item.name || "Item");
      doc.text(
        `Quantity: ${item.quantity}  Unit: ${formatCurrency(
          item.unitPrice
        )}  Line: ${formatCurrency(item.lineTotal)}`
      );
      doc.moveDown(0.4);
    });

    doc.moveDown();
    doc.fontSize(12).text(`Subtotal: ${formatCurrency(order.subtotal)}`);
    doc.text(`Tax: ${formatCurrency(order.tax)}`);
    doc.text(`Shipping: ${formatCurrency(order.shipping)}`);
    doc.fontSize(14).text(`Total: ${formatCurrency(order.total)}`);

    doc.end();
  });
}

async function getInvoicesByDateRange(startDate, endDate) {
  const filter = {};

  filter.paidAt = { $ne: null };

  if (startDate) {
    const start = new Date(startDate);
    // gün başlangıcı
    start.setHours(0, 0, 0, 0);
    filter.paidAt.$gte = start;
  }

  if (endDate) {
    const end = new Date(endDate);
 
    end.setHours(23, 59, 59, 999);
    filter.paidAt.$lte = end;
  }

  const orders = await Order.find(filter)
    .sort({ paidAt: -1 })
    .lean();

  return orders.map((order) => ({
    ...order,
    invoiceNumber:
      order.invoiceNumber || buildInvoiceNumber(order.id || order._id),
  }));
}

module.exports = {
  generateInvoicePdf,
  getInvoicesByDateRange,
};
