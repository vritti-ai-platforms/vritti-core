import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { SITE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PurchaseItemComparisonTableResponse } from '@/schemas/purchases';
import { getPurchaseItemComparison } from '@/services/site/purchases.service';
import { PURCHASE_ITEM_COMPARISON_KEY } from './keys';

// Fetches one page of a purchase's items with the quotation lines that quote each; self-gates on the view permission
export function usePurchaseItemComparison(id: string) {
  const { available } = usePermission(SITE_PURCHASES.quotations.view);
  return useQuery<PurchaseItemComparisonTableResponse, AxiosError>({
    queryKey: PURCHASE_ITEM_COMPARISON_KEY(id),
    queryFn: () => getPurchaseItemComparison(id),
    placeholderData: keepPreviousData,
    enabled: available,
  });
}
