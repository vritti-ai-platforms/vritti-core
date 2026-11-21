import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierInvoiceCounts, SupplierInvoiceRef } from '@/schemas/supplier-invoices';
import { getSupplierInvoiceCounts } from '@/services/legal-entity/supplier-invoices.service';
import { LE_SUPPLIER_INVOICE_COUNTS_KEY } from './keys';

// Fetches how many lines and holds an invoice has, one per tab; under the invoice's key, so whatever refreshes the
// invoice refreshes them
export function useSupplierInvoiceCounts(invoice: SupplierInvoiceRef) {
  return useQuery<SupplierInvoiceCounts, AxiosError>({
    queryKey: LE_SUPPLIER_INVOICE_COUNTS_KEY(invoice.id),
    queryFn: () => getSupplierInvoiceCounts(invoice.id),
  });
}
