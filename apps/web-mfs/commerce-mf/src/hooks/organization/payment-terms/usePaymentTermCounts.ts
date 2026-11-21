import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PaymentTermCounts } from '@/schemas/payment-terms';
import { getPaymentTermCounts } from '@/services/organization/payment-terms.service';
import { PAYMENT_TERM_COUNTS_KEY } from './keys';

// Fetches how many rules a payment term has, one per tab; under the term's key, so whatever refreshes the term refreshes
// them
export function usePaymentTermCounts(id: string) {
  return useQuery<PaymentTermCounts, AxiosError>({
    queryKey: PAYMENT_TERM_COUNTS_KEY(id),
    queryFn: () => getPaymentTermCounts(id),
  });
}
