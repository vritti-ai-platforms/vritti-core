import { useQuery } from '@tanstack/react-query';
import { SITE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PurchaseItemSiteStock } from '@/schemas/purchases';
import { getPurchaseItemSiteStock } from '@/services/site/purchases.service';
import { PURCHASE_ITEM_SITE_STOCK_KEY } from './keys';

// Fetches a purchase item's stock at the purchase's site, null while the site does not carry it; self-gates on the view permission
export function usePurchaseItemSiteStock(id: string, itemId: string) {
  const { available } = usePermission(SITE_PURCHASES.view);
  return useQuery<PurchaseItemSiteStock | null, AxiosError>({
    queryKey: PURCHASE_ITEM_SITE_STOCK_KEY(id, itemId),
    queryFn: () => getPurchaseItemSiteStock(id, itemId),
    enabled: available,
  });
}
