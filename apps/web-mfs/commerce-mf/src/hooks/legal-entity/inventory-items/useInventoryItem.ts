import { keepPreviousData, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { InventoryItemMrpData } from '@/schemas/inventory-item-mrp';
import type { InventoryItemData } from '@/schemas/inventory-items';
import type {
  InventoryItemPriceGraph,
  InventoryItemSuppliersTableResponse,
  ItemSupplierPriceComparisonTableResponse,
  PriceGraphSelection,
  PricesTableContext,
} from '@/schemas/suppliers';
import {
  getLeInventoryItem,
  getLeInventoryItemMrp,
  getLeInventoryItemPriceGraph,
  getLeInventoryItemPricesTable,
  getLeInventoryItemSuppliersTable,
  saveLeInventoryItemPriceGraph,
} from '@/services/legal-entity/inventory-items.service';
import {
  LE_INVENTORY_ITEM_KEY,
  LE_INVENTORY_ITEM_MRP_KEY,
  LE_INVENTORY_ITEM_PRICE_GRAPH_KEY,
  LE_INVENTORY_ITEM_PRICES_TABLE_KEY,
  LE_INVENTORY_ITEM_SUPPLIERS_TABLE_KEY,
} from './keys';

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

// The item's MRPs; self-gates on the LE MRP view permission
export function useInventoryItemMrp(inventoryItemId: string) {
  const { available } = usePermission(LE_INVENTORY_ITEMS.mrp.view);
  return useQuery<InventoryItemMrpData[], AxiosError>({
    queryKey: LE_INVENTORY_ITEM_MRP_KEY(inventoryItemId),
    queryFn: () => getLeInventoryItemMrp(inventoryItemId),
    enabled: available && !!inventoryItemId,
  });
}

// What the price graph shows, per its saved selection of site, window, suppliers and MRPs; self-gates on the price view
// permission
export function useInventoryItemPriceGraph(inventoryItemId: string) {
  const { available } = usePermission(LE_INVENTORY_ITEMS.prices.view);
  return useQuery<InventoryItemPriceGraph, AxiosError>({
    queryKey: LE_INVENTORY_ITEM_PRICE_GRAPH_KEY(inventoryItemId),
    queryFn: () => getLeInventoryItemPriceGraph(inventoryItemId),
    placeholderData: keepPreviousData,
    enabled: available && !!inventoryItemId,
  });
}

// Saves a new graph selection; the controls take it at once, then the graph refetches
export function useSaveInventoryItemPriceGraph(inventoryItemId: string) {
  const queryClient = useQueryClient();
  const queryKey = LE_INVENTORY_ITEM_PRICE_GRAPH_KEY(inventoryItemId);
  return useMutation<void, AxiosError, PriceGraphSelection>({
    mutationFn: (selection) => saveLeInventoryItemPriceGraph(inventoryItemId, selection),
    onMutate: (selection) => {
      queryClient.setQueryData<InventoryItemPriceGraph>(queryKey, (graph) => (graph ? { ...graph, selection } : graph));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

// Every supplier's standing for the item at the context's site and day; self-gates on the price view permission
export function useInventoryItemPricesTable(inventoryItemId: string, context: PricesTableContext) {
  const { available } = usePermission(LE_INVENTORY_ITEMS.prices.view);
  return useQuery<ItemSupplierPriceComparisonTableResponse, AxiosError>({
    queryKey: [...LE_INVENTORY_ITEM_PRICES_TABLE_KEY(inventoryItemId), context.site ?? '', context.asOf],
    queryFn: () => getLeInventoryItemPricesTable(inventoryItemId, context),
    placeholderData: keepPreviousData,
    enabled: available && !!inventoryItemId,
  });
}
