import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ReceiveWithInvoiceDetail } from '@/schemas/receive-with-invoices';
import { getReceiveWithInvoice } from '@/services/legal-entity/purchases.service';
import { RECEIVE_WITH_INVOICE_KEY } from './keys';

// Fetches a Receive with Invoice by its supplier invoice
export function useReceiveWithInvoice(invoiceId: string) {
  return useSuspenseQuery<ReceiveWithInvoiceDetail, AxiosError>({
    queryKey: RECEIVE_WITH_INVOICE_KEY(invoiceId),
    queryFn: () => getReceiveWithInvoice(invoiceId),
  });
}
