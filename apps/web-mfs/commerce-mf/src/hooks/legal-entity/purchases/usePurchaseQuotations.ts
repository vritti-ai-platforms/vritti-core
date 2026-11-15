import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PurchaseQuotation } from '@/schemas/purchases';
import { getPurchaseQuotations } from '@/services/legal-entity/purchases.service';
import { PURCHASE_QUOTATIONS_KEY } from './keys';

// Fetches the quotations linked to a purchase for its Quoting view and the quotes compared while sourcing
export function usePurchaseQuotations(id: string) {
  return useSuspenseQuery<PurchaseQuotation[], AxiosError>({
    queryKey: PURCHASE_QUOTATIONS_KEY(id),
    queryFn: () => getPurchaseQuotations(id),
  });
}
