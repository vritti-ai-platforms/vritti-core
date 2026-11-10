import { keepPreviousData, queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { InventoryItemMrpTableResponse } from '@/schemas/inventory-item-mrp';
import type { InventoryItemData } from '@/schemas/inventory-items';
import type {
  InventoryItemPriceHistory,
  InventoryItemSuppliersTableResponse,
  ItemSupplierPriceComparisonTableResponse,
} from '@/schemas/suppliers';
import {
  getLeInventoryItem,
  getLeInventoryItemMrpTable,
  getLeInventoryItemPriceHistory,
  getLeInventoryItemPricesTable,
  getLeInventoryItemSuppliersTable,
} from '@/services/legal-entity/inventory-items.service';
import {
  LE_INVENTORY_ITEM_KEY,
  LE_INVENTORY_ITEM_MRP_KEY,
  LE_INVENTORY_ITEM_PRICE_HISTORY_KEY,
  LE_INVENTORY_ITEM_PRICES_TABLE_KEY,
  LE_INVENTORY_ITEM_SUPPLIERS_TABLE_KEY,
} from './keys';

const ITEM_ID_INDEX = LE_INVENTORY_ITEM_KEY('').length - 1;

export function useInventoryItem(id: string) {
  return useSuspenseQuery<InventoryItemData, AxiosError>({
    queryKey: LE_INVENTORY_ITEM_KEY(id),
    queryFn: () => getLeInventoryItem(id),
  });
}

// The legal entity's suppliers carrying the item; self-gates on the LE view permission
export function useInventoryItemSuppliersTable(inventoryItemId: string) {
  const { available } = usePermission(LE_INVENTORY_ITEMS.view);
  return useQuery<InventoryItemSuppliersTableResponse, AxiosError>({
    queryKey: LE_INVENTORY_ITEM_SUPPLIERS_TABLE_KEY(inventoryItemId),
    queryFn: () => getLeInventoryItemSuppliersTable(inventoryItemId),
    enabled: available && !!inventoryItemId,
  });
}

// The item's MRPs for its data table; keeps the rows on screen while the table state changes, never another item's,
// and self-gates on the LE MRP view permission
export function useInventoryItemMrpTable(inventoryItemId: string) {
  const { available } = usePermission(LE_INVENTORY_ITEMS.mrp.view);
  return useQuery<InventoryItemMrpTableResponse, AxiosError>({
    queryKey: LE_INVENTORY_ITEM_MRP_KEY(inventoryItemId),
    queryFn: () => getLeInventoryItemMrpTable(inventoryItemId),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[ITEM_ID_INDEX] === inventoryItemId ? previous : undefined,
    enabled: available && !!inventoryItemId,
  });
}

// The price history's query options — `useChart` runs them once the context bar has settled; self-gates on the price
// view permission
export function useInventoryItemPriceHistoryQuery(inventoryItemId: string) {
  const { available } = usePermission(LE_INVENTORY_ITEMS.prices.view);
  return queryOptions<InventoryItemPriceHistory, AxiosError>({
    queryKey: LE_INVENTORY_ITEM_PRICE_HISTORY_KEY(inventoryItemId),
    queryFn: () => getLeInventoryItemPriceHistory(inventoryItemId),
    placeholderData: keepPreviousData,
    enabled: available && !!inventoryItemId,
  });
}

// Every supplier's standing for the item at the table's context site and day; keeps the rows on screen while the
// filters or context change, never another item's, and self-gates on the price view permission
export function useInventoryItemPricesTable(inventoryItemId: string) {
  const { available } = usePermission(LE_INVENTORY_ITEMS.prices.view);
  return useQuery<ItemSupplierPriceComparisonTableResponse, AxiosError>({
    queryKey: LE_INVENTORY_ITEM_PRICES_TABLE_KEY(inventoryItemId),
    queryFn: () => getLeInventoryItemPricesTable(inventoryItemId),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[ITEM_ID_INDEX] === inventoryItemId ? previous : undefined,
    enabled: available && !!inventoryItemId,
  });
}
