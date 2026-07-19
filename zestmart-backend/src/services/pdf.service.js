const PDFDocument = require('pdfkit');

/**
 * Renders an Order into a downloadable PDF invoice and returns it as a
 * Buffer. PDFKit builds PDFs as a writable stream, so this collects
 * every chunk it emits and resolves once the document is finalized —
 * a Buffer is easiest for the controller to send as a single response
 * with an accurate Content-Length header.
 */
const generateInvoicePdf = (order) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const money = (n) => `Rs. ${Number(n).toFixed(2)}`;

    // ---------- Header ----------
    doc.fontSize(22).font('Helvetica-Bold').text('ZestMart', { continued: false });
    doc.fontSize(10).font('Helvetica').fillColor('#555').text('Premium Indian Lifestyle Ecommerce');
    doc.moveDown(1.5);

    doc.fillColor('#000').fontSize(16).font('Helvetica-Bold').text('Invoice');
    doc.moveDown(0.3);

    doc.fontSize(10).font('Helvetica');
    doc.text(`Invoice Number: ${order.invoiceNumber}`);
    doc.text(`Order Number: ${order.orderNumber}`);
    doc.text(`Date: ${new Date(order.createdAt || order.placedAt).toLocaleDateString('en-IN')}`);
    doc.text(`Payment Method: ${order.paymentMethod === 'razorpay' ? 'Razorpay (Online)' : 'Cash on Delivery'}`);
    doc.text(`Payment Status: ${order.paymentStatus}`);
    doc.moveDown(1);

    // ---------- Bill to ----------
    const addr = order.shippingAddress || {};
    doc.font('Helvetica-Bold').text('Bill To:');
    doc.font('Helvetica');
    doc.text(addr.fullName || '');
    doc.text(addr.phone || '');
    doc.text(`${addr.line1 || ''}${addr.line2 ? ', ' + addr.line2 : ''}`);
    doc.text(`${addr.city || ''}, ${addr.state || ''} ${addr.postalCode || ''}`);
    doc.text(addr.country || 'India');
    doc.moveDown(1.5);

    // ---------- Items table ----------
    const tableTop = doc.y;
    const col = { title: 50, qty: 300, price: 360, total: 460 };

    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Item', col.title, tableTop);
    doc.text('Qty', col.qty, tableTop);
    doc.text('Price', col.price, tableTop);
    doc.text('Total', col.total, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

    let y = tableTop + 22;
    doc.font('Helvetica').fontSize(10);
    order.items.forEach((item) => {
      const rowHeight = 20;
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.text(item.title + (item.variant ? ` (${item.variant})` : ''), col.title, y, { width: 240 });
      doc.text(String(item.quantity), col.qty, y);
      doc.text(money(item.price), col.price, y);
      doc.text(money(item.lineTotal), col.total, y);
      y += rowHeight;
    });

    doc.moveTo(50, y + 5).lineTo(545, y + 5).stroke();
    y += 15;

    // ---------- Totals ----------
    const labelX = 300;
    const valueX = 460;
    const valueWidth = 85;

    const totalsRow = (label, value, bold = false) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10);
      doc.text(label, labelX, y, { width: 150, align: 'left' });
      doc.text(value, valueX, y, { width: valueWidth, align: 'right' });
      y += bold ? 20 : 16;
    };

    totalsRow('Subtotal:', money(order.subtotal));
    if (order.discountAmount > 0) {
      totalsRow(`Discount${order.couponCode ? ` (${order.couponCode})` : ''}:`, `- ${money(order.discountAmount)}`);
    }
    totalsRow('Shipping:', money(order.shippingFee));
    if (order.taxAmount > 0) totalsRow('Tax:', money(order.taxAmount));
    totalsRow('Total:', money(order.totalAmount), true);

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#888').text('Thank you for shopping with ZestMart!', 50, doc.y, { align: 'center' });

    doc.end();
  });

module.exports = { generateInvoicePdf };
