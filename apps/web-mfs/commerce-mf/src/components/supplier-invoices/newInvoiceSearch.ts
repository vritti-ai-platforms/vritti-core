export const NEW_INVOICE_PARAM = 'newInvoice';
export const NEW_INVOICE_SUPPLIER_PARAM = 'supplierId';
export const NEW_INVOICE_SITE_PARAM = 'siteId';

// The query string that opens an invoices list's Add Invoice dialog, prefilled with a supplier and site; `extra` adds
// the page's own params, such as the tab the list sits on
export function newInvoiceSearch(
  prefill: { supplierId?: string; siteId?: string },
  extra: Record<string, string> = {},
): string {
  const params = new URLSearchParams({ ...extra, [NEW_INVOICE_PARAM]: '1' });
  if (prefill.supplierId) params.set(NEW_INVOICE_SUPPLIER_PARAM, prefill.supplierId);
  if (prefill.siteId) params.set(NEW_INVOICE_SITE_PARAM, prefill.siteId);
  return `?${params.toString()}`;
}
