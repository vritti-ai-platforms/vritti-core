import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PaymentTermData } from '@/schemas/payment-terms';
import { getPaymentTerm } from '@/services/organization/payment-terms.service';
import { PAYMENT_TERM_KEY } from './keys';

export function usePaymentTerm(id: string) {
  return useSuspenseQuery<PaymentTermData, AxiosError>({
    queryKey: PAYMENT_TERM_KEY(id),
    queryFn: () => getPaymentTerm(id),
  });
}
