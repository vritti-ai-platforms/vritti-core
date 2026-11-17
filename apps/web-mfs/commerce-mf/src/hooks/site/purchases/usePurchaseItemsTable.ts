import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { SITE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PurchaseItemsTableResponse } from '@/schemas/purchases';
import { getPurchaseItemsTable } from '@/services/site/purchases.service';
import { PURCHASE_ITEMS_TABLE_KEY } from './keys';

// Fetches one page of a purchase's items with how far each has got; self-gates on the view permission
export function usePurchaseItemsTable(id: string) {
  const { available } = usePermission(SITE_PURCHASES.view);
  return useQuery<PurchaseItemsTableResponse, AxiosError>({
    queryKey: PURCHASE_ITEMS_TABLE_KEY(id),
    queryFn: () => getPurchaseItemsTable(id),
    placeholderData: keepPreviousData,
    enabled: available,
  });
}
