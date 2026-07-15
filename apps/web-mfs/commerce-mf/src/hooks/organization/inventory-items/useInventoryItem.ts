import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InventoryItemData } from '@/schemas/inventory-items';
import { getOrgInventoryItem } from '@/services/organization/inventory-items.service';
import { ORG_INVENTORY_ITEM_KEY } from './keys';

// Fetches ORG inventory item detail by ID; suspends until data is available
export function useInventoryItem(id: string) {
  return useSuspenseQuery<InventoryItemData, AxiosError>({
    queryKey: ORG_INVENTORY_ITEM_KEY(id),
    queryFn: () => getOrgInventoryItem(id),
  });
}
