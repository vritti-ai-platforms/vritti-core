import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierInvoiceDetail } from '@/schemas/supplier-invoices';
import { getSupplierInvoice } from '@/services/legal-entity/supplier-invoices.service';
import { LE_SUPPLIER_INVOICE_KEY } from './keys';

// Fetches an invoice with its lines and holds, for its page
export function useSupplierInvoice(invoiceId: string) {
  return useSuspenseQuery<SupplierInvoiceDetail, AxiosError>({
    queryKey: LE_SUPPLIER_INVOICE_KEY(invoiceId),
    queryFn: () => getSupplierInvoice(invoiceId),
  });
}
