const { generateInvoicePdfBuffer } = require('../invoicePdf');
const { formatInvoiceAddressLinesDe } = require('../../config/brandLegal');

describe('generateInvoicePdfBuffer', () => {
  it('returns a valid PDF buffer with invoice metadata', async () => {
    const buffer = await generateInvoicePdfBuffer({
      invoiceNumber: 'MC-2026-0099',
      productNameDe: 'Premium 1-Monats-Pass',
      amount: 9.9,
      purchaseDate: new Date('2026-09-22'),
    });

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(500);
  });

  it('uses current legal address defaults', () => {
    const lines = formatInvoiceAddressLinesDe();
    expect(lines).toContain('Am Gigalberg 7a');
    expect(lines.some((l) => l.includes('2000') && l.includes('Zissersdorf'))).toBe(true);
  });
});
