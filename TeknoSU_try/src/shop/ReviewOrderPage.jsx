import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";

const ReviewOrderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    items = [],
    total = 0,
    invoicePdfBase64,
    invoiceFileName = "invoice.pdf",
    emailSent,
  } = location.state || {};

  const handleDownloadInvoice = () => {
    if (invoicePdfBase64) {
      const byteCharacters = atob(invoicePdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = invoiceFileName || "invoice.pdf";
      link.click();
      URL.revokeObjectURL(url);
      return;
    }
    // Fallback: client-generated PDF if backend PDF yoksa
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Invoice", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);

    let y = 40;
    items.forEach((item, idx) => {
      doc.text(
        `${idx + 1}. ${item.name} - $${item.price} x ${item.quantity} = $${(
          item.price * item.quantity
        ).toFixed(2)}`,
        14,
        y
      );
      y += 10;
    });

    doc.text(`Total: $${total.toFixed(2)}`, 14, y + 10);
    doc.save("invoice.pdf");
  };

  return (
    <div className="container padding-tb">
      <h2>Review Your Order</h2>
      {emailSent !== undefined && (
        <p style={{ color: emailSent ? "green" : "orange" }}>
          {emailSent ? "Invoice emailed to your address." : "Invoice email could not be sent."}
        </p>
      )}
      {items.length === 0 ? (
        <p>Your order is empty.</p>
      ) : (
        <>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td>${item.price}</td>
                  <td>{item.quantity}</td>
                  <td>${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>Order Total: ${total.toFixed(2)}</h3>
          <button className="btn btn-primary" onClick={handleDownloadInvoice}>
            Download Invoice (PDF)
          </button>
          <button
            className="btn btn-secondary ms-2"
            onClick={() => navigate("/")}
          >
            Back to Shop
          </button>
        </>
      )}
    </div>
  );
};

export default ReviewOrderPage;
