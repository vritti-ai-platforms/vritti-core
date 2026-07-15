import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SiteGroupInventoryItemData } from '@/schemas/site-group-inventory-items';
import { getSiteGroupInventoryItemsMatrix } from '@/services/site-group/inventory-items.service';
import { SITE_GROUP_INVENTORY_ITEMS_MATRIX_KEY } from './keys';

// Fetches the full item x site availability matrix
export function useSiteGroupInventoryItemsMatrix(siteIds: string[]) {
  return useQuery<SiteGroupInventoryItemData[], AxiosError>({
    queryKey: SITE_GROUP_INVENTORY_ITEMS_MATRIX_KEY(siteIds),
    queryFn: () => getSiteGroupInventoryItemsMatrix(siteIds),
    enabled: siteIds.length > 0,
  });
}
