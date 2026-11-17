import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { SITE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PurchaseItemAllocationsTableResponse } from '@/schemas/purchases';
import { getPurchaseItemAllocationsTable } from '@/services/site/purchases.service';
import { PURCHASE_ITEM_ALLOCATIONS_TABLE_KEY } from './keys';

// Fetches one page of a purchase item's allocations; self-gates on the view permission
export function usePurchaseItemAllocationsTable(id: string, itemId: string) {
  const { available } = usePermission(SITE_PURCHASES.view);
  return useQuery<PurchaseItemAllocationsTableResponse, AxiosError>({
    queryKey: PURCHASE_ITEM_ALLOCATIONS_TABLE_KEY(id, itemId),
    queryFn: () => getPurchaseItemAllocationsTable(id, itemId),
    placeholderData: keepPreviousData,
    enabled: available,
  });
}
