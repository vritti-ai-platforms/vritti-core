import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { InventoryItemPriceHistory, ItemSupplierPricesTableResponse } from '@/schemas/suppliers';
import { getInventoryItemPriceHistory, getInventoryItemPricesTable } from '@/services/site/inventory-items.service';
import { INVENTORY_ITEM_PRICE_HISTORY_KEY, INVENTORY_ITEM_PRICES_TABLE_KEY } from './keys';

// Every supplier's price rows for the item at this site; self-gates on the price view permission
export function useInventoryItemPricesTable(inventoryItemId: string) {
  const { available } = usePermission(SITE_INVENTORY_ITEMS.prices.view);
  return useQuery<ItemSupplierPricesTableResponse, AxiosError>({
    queryKey: INVENTORY_ITEM_PRICES_TABLE_KEY(inventoryItemId),
    queryFn: () => getInventoryItemPricesTable(inventoryItemId),
    enabled: available && !!inventoryItemId,
  });
}

// The price history's query options — `useChart` runs them once the context bar has settled; self-gates on the price
// view permission
export function useInventoryItemPriceHistoryQuery(inventoryItemId: string) {
  const { available } = usePermission(SITE_INVENTORY_ITEMS.prices.view);
  return queryOptions<InventoryItemPriceHistory, AxiosError>({
    queryKey: INVENTORY_ITEM_PRICE_HISTORY_KEY(inventoryItemId),
    queryFn: () => getInventoryItemPriceHistory(inventoryItemId),
    placeholderData: keepPreviousData,
    enabled: available && !!inventoryItemId,
  });
}
