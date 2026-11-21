import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { LeInventoryItemCounts } from '@/schemas/inventory-items';
import { getLeInventoryItemCounts } from '@/services/legal-entity/inventory-items.service';
import { LE_INVENTORY_ITEM_COUNTS_KEY } from './keys';

// Fetches how many suppliers, sites and MRPs the item's tabs list; under the item's key, so whatever refreshes the item
// refreshes them
export function useInventoryItemCounts(id: string) {
  return useQuery<LeInventoryItemCounts, AxiosError>({
    queryKey: LE_INVENTORY_ITEM_COUNTS_KEY(id),
    queryFn: () => getLeInventoryItemCounts(id),
  });
}
