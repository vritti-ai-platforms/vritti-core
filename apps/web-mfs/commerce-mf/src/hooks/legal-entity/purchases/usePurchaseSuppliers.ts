import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PurchaseLeg } from '@/schemas/purchases';
import { getPurchaseSuppliers } from '@/services/legal-entity/purchases.service';
import { PURCHASE_SUPPLIERS_KEY } from './keys';

// Fetches the suppliers a purchase sources from for its Sourcing preview, Procuring view and activity filter
export function usePurchaseSuppliers(id: string) {
  return useSuspenseQuery<PurchaseLeg[], AxiosError>({
    queryKey: PURCHASE_SUPPLIERS_KEY(id),
    queryFn: () => getPurchaseSuppliers(id),
  });
}
