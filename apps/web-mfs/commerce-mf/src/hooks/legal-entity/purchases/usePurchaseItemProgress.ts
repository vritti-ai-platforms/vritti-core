import { useQuery } from '@tanstack/react-query';
import { LE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PurchaseItemProgressSummary } from '@/schemas/purchases';
import { getPurchaseItemProgress } from '@/services/legal-entity/purchases.service';
import { PURCHASE_ITEM_PROGRESS_KEY } from './keys';

// Fetches how far a purchase item has got, in all and per supplier; self-gates on the view permission
export function usePurchaseItemProgress(id: string, itemId: string) {
  const { available } = usePermission(LE_PURCHASES.view);
  return useQuery<PurchaseItemProgressSummary, AxiosError>({
    queryKey: PURCHASE_ITEM_PROGRESS_KEY(id, itemId),
    queryFn: () => getPurchaseItemProgress(id, itemId),
    enabled: available,
  });
}
