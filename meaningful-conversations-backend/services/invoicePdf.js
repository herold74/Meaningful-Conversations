const PDFDocument = require('pdfkit');
const brand = require('../config/brand');
const { brandLegal, formatInvoiceAddressLinesDe } = require('../config/brandLegal');

/**
 * @returns {Promise<Buffer>}
 */
function generateInvoicePdfBuffer({
  invoiceNumber,
  productNameDe,
  amount,
  purchaseDate,
  paymentMethod = 'PayPal',
}) {
  const dateStr = new Date(purchaseDate).toLocaleDateString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const amountStr = `${amount.toFixed(2)} €`;
  const sellerLines = formatInvoiceAddressLinesDe();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const headerColor = brand.primaryColor || '#1B7272';

    doc.fillColor(headerColor).fontSize(22).text('Rechnung', { align: 'center' });
    doc.moveDown(0.3);
    doc.fillColor('#333333').fontSize(11).text(brand.appName, { align: 'center' });
    doc.moveDown(1.5);

    doc.fillColor('#111111').fontSize(10);
    doc.text('Leistungserbringer:', { continued: false });
    doc.fillColor('#444444');
    sellerLines.forEach((line) => doc.text(line));
    doc.text(brand.contactEmail);

    doc.moveDown(1);
    const metaY = doc.y;
    doc.fillColor('#111111');
    doc.text(`Rechnungsnr.: ${invoiceNumber}`, 350, metaY, { width: 200, align: 'right' });
    doc.text(`Datum: ${dateStr}`, 350, metaY + 14, { width: 200, align: 'right' });
    doc.text(`Zahlungsart: ${paymentMethod}`, 350, metaY + 28, { width: 200, align: 'right' });

    doc.moveDown(3);
    doc.fillColor('#111111').fontSize(11);
    doc.text('Leistungsbeschreibung', 50, doc.y);
    doc.moveDown(0.5);

    const tableTop = doc.y;
    doc.rect(50, tableTop, 495, 22).fill(headerColor);
    doc.fillColor('#ffffff').fontSize(10);
    doc.text('Beschreibung', 58, tableTop + 6, { width: 320 });
    doc.text('Betrag', 400, tableTop + 6, { width: 130, align: 'right' });

    const rowY = tableTop + 22;
    doc.fillColor('#111111');
    doc.rect(50, rowY, 495, 28).stroke('#dddddd');
    doc.text(productNameDe, 58, rowY + 8, { width: 320 });
    doc.text(amountStr, 400, rowY + 8, { width: 130, align: 'right' });

    const totalY = rowY + 36;
    doc.font('Helvetica-Bold');
    doc.text('Gesamtbetrag:', 58, totalY);
    doc.fillColor(headerColor).text(amountStr, 400, totalY, { width: 130, align: 'right' });
    doc.font('Helvetica');

    doc.moveDown(4);
    doc.fillColor('#555555').fontSize(9);
    doc.text(
      'Umsatzsteuerbefreit — Kleinunternehmer gemäß § 6 Abs. 1 Z 27 UStG. Es wird keine Umsatzsteuer ausgewiesen.',
      { width: 495 },
    );
    doc.moveDown(0.8);
    doc.fillColor('#111111').fontSize(10);
    doc.text(`Zahlung erhalten — Der Betrag wurde per ${paymentMethod} beglichen.`);

    doc.moveDown(2);
    doc.fillColor('#888888').fontSize(8);
    doc.text(
      `${brand.appName} | ${brand.providerUrl.replace(/^https?:\/\//, '')} — ${brandLegal.ownerLegalName}`,
      { align: 'center', width: 495 },
    );

    doc.end();
  });
}

module.exports = { generateInvoicePdfBuffer };
