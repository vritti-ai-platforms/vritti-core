import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SiteInventoryItemCounts } from '@/schemas/inventory-items';
import { getInventoryItemCounts } from '@/services/site/inventory-items.service';
import { INVENTORY_ITEM_COUNTS_KEY } from './keys';

// Fetches how many rows each tab of the item's detail page lists at the site; under the item's key, so whatever
// refreshes the item refreshes them
export function useInventoryItemCounts(id: string) {
  return useQuery<SiteInventoryItemCounts, AxiosError>({
    queryKey: INVENTORY_ITEM_COUNTS_KEY(id),
    queryFn: () => getInventoryItemCounts(id),
  });
}
