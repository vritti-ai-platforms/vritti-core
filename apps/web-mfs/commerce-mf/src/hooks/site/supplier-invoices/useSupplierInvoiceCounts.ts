import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierInvoiceCounts, SupplierInvoiceRef } from '@/schemas/supplier-invoices';
import { getSupplierInvoiceCounts } from '@/services/site/supplier-invoices.service';
import { SITE_SUPPLIER_INVOICE_COUNTS_KEY } from './keys';

// Fetches how many lines and holds one of the supplier's invoices has, one per tab; under the invoice's key, so
// whatever refreshes the invoice refreshes them
export function useSupplierInvoiceCounts(invoice: SupplierInvoiceRef) {
  return useQuery<SupplierInvoiceCounts, AxiosError>({
    queryKey: SITE_SUPPLIER_INVOICE_COUNTS_KEY(invoice.supplierId, invoice.id),
    queryFn: () => getSupplierInvoiceCounts(invoice.supplierId, invoice.id),
  });
}
