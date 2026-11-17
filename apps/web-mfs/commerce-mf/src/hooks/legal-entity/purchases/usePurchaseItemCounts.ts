import { useQuery } from '@tanstack/react-query';
import { LE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PurchaseItemCounts } from '@/schemas/purchases';
import { getPurchaseItemCounts } from '@/services/legal-entity/purchases.service';
import { PURCHASE_ITEM_COUNTS_KEY } from './keys';

// Fetches the counts a purchase item's page labels its tabs with; self-gates on the view permission
export function usePurchaseItemCounts(id: string, itemId: string) {
  const { available } = usePermission(LE_PURCHASES.view);
  return useQuery<PurchaseItemCounts, AxiosError>({
    queryKey: PURCHASE_ITEM_COUNTS_KEY(id, itemId),
    queryFn: () => getPurchaseItemCounts(id, itemId),
    enabled: available,
  });
}
