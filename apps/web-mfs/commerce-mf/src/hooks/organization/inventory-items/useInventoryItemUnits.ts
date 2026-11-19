import { skipToken, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InventoryItemUnitsData } from '@/schemas/inventory-item-uom-conversions';
import { getInventoryItemUnits } from '@/services/organization/inventory-items.service';
import { ORG_INVENTORY_ITEM_UNITS_KEY } from './keys';

// Fetches the units a quantity of the item can be entered in, with their ratios to its primary unit; idle until an item
// is picked
export function useInventoryItemUnits(inventoryItemId: string | undefined) {
  return useQuery<InventoryItemUnitsData, AxiosError>({
    queryKey: ORG_INVENTORY_ITEM_UNITS_KEY(inventoryItemId ?? ''),
    queryFn: inventoryItemId ? () => getInventoryItemUnits(inventoryItemId) : skipToken,
  });
}
