import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PurchaseLeg } from '@/schemas/purchases';
import { getPurchaseSupplier } from '@/services/site/purchases.service';
import { PURCHASE_SUPPLIER_KEY } from './keys';

// Fetches one supplier of a purchase with its allocations, documents, progress, actions and blockers
export function usePurchaseSupplier(id: string, legId: string) {
  return useQuery<PurchaseLeg, AxiosError>({
    queryKey: PURCHASE_SUPPLIER_KEY(id, legId),
    queryFn: () => getPurchaseSupplier(id, legId),
  });
}
