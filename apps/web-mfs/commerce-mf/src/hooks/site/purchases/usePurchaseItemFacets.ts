import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { SITE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PurchaseItemFacets } from '@/schemas/purchases';
import { getPurchaseItemFacets } from '@/services/site/purchases.service';
import { PURCHASE_ITEM_FACETS_KEY } from './keys';

// Counts a purchase's items in each bucket of the items table; self-gates on the view permission
export function usePurchaseItemFacets(id: string) {
  const { available } = usePermission(SITE_PURCHASES.view);
  return useQuery<PurchaseItemFacets, AxiosError>({
    queryKey: PURCHASE_ITEM_FACETS_KEY(id),
    queryFn: () => getPurchaseItemFacets(id),
    placeholderData: keepPreviousData,
    enabled: available,
  });
}
