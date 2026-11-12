/**
 * Legal entity / invoice address — shared defaults for mail, PDF, and imprint.
 * Override via BRAND_INVOICE_* / BRAND_OWNER_LEGAL_NAME in backend .env.
 */
const brandLegal = {
  ownerLegalName: process.env.BRAND_OWNER_LEGAL_NAME || 'Günter Herold, MSc',
  ownerProfessionDe: process.env.BRAND_OWNER_PROFESSION_DE || 'Lebens- und Sozialberatung',
  ownerProfessionEn: process.env.BRAND_OWNER_PROFESSION_EN || 'Life and Social Counseling',
  invoiceStreet: process.env.BRAND_INVOICE_STREET || 'Am Gigalberg 7a',
  invoicePostalCode: process.env.BRAND_INVOICE_POSTAL_CODE || '2000',
  invoiceCity: process.env.BRAND_INVOICE_CITY || 'Zissersdorf',
  invoiceCountryDe: process.env.BRAND_INVOICE_COUNTRY_DE || 'Österreich',
  invoiceCountryEn: process.env.BRAND_INVOICE_COUNTRY_EN || 'Austria',
};

function formatInvoiceCityLine() {
  return `${brandLegal.invoicePostalCode} ${brandLegal.invoiceCity}`;
}

function formatInvoiceAddressLinesDe() {
  return [
    brandLegal.ownerLegalName,
    brandLegal.ownerProfessionDe,
    brandLegal.invoiceStreet,
    formatInvoiceCityLine(),
    brandLegal.invoiceCountryDe,
  ];
}

module.exports = {
  brandLegal,
  formatInvoiceCityLine,
  formatInvoiceAddressLinesDe,
};
