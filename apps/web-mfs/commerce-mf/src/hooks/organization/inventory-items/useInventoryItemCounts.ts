import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OrgInventoryItemCounts } from '@/schemas/inventory-items';
import { getOrgInventoryItemCounts } from '@/services/organization/inventory-items.service';
import { ORG_INVENTORY_ITEM_COUNTS_KEY } from './keys';

// Fetches how many UOM conversions, MRPs and suppliers an ORG inventory item has, one per tab; under the item's key, so
// whatever refreshes the item refreshes them
export function useInventoryItemCounts(id: string) {
  return useQuery<OrgInventoryItemCounts, AxiosError>({
    queryKey: ORG_INVENTORY_ITEM_COUNTS_KEY(id),
    queryFn: () => getOrgInventoryItemCounts(id),
  });
}
