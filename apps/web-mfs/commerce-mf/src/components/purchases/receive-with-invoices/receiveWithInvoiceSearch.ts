export const RECEIVE_WITH_INVOICE_SUPPLIER_PARAM = 'supplierId';
export const RECEIVE_WITH_INVOICE_SITE_PARAM = 'siteId';

// The query string that opens a new Receive with Invoice for a supplier and, at the legal entity, a site
export function receiveWithInvoiceSearch(prefill: { supplierId?: string; siteId?: string }): string {
  const params = new URLSearchParams();
  if (prefill.supplierId) params.set(RECEIVE_WITH_INVOICE_SUPPLIER_PARAM, prefill.supplierId);
  if (prefill.siteId) params.set(RECEIVE_WITH_INVOICE_SITE_PARAM, prefill.siteId);
  const search = params.toString();
  return search ? `?${search}` : '';
}
