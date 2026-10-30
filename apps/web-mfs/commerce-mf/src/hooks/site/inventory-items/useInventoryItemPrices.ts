import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type {
  InventoryItemPriceGraph,
  ItemSupplierPricesTableResponse,
  PriceGraphSelection,
} from '@/schemas/suppliers';
import {
  getInventoryItemPriceGraph,
  getInventoryItemPricesTable,
  saveInventoryItemPriceGraph,
} from '@/services/site/inventory-items.service';
import { INVENTORY_ITEM_PRICE_GRAPH_KEY, INVENTORY_ITEM_PRICES_TABLE_KEY } from './keys';

// Every supplier's price rows for the item at this site; self-gates on the price view permission
export function useInventoryItemPricesTable(inventoryItemId: string) {
  const { available } = usePermission(SITE_INVENTORY_ITEMS.prices.view);
  return useQuery<ItemSupplierPricesTableResponse, AxiosError>({
    queryKey: INVENTORY_ITEM_PRICES_TABLE_KEY(inventoryItemId),
    queryFn: () => getInventoryItemPricesTable(inventoryItemId),
    enabled: available && !!inventoryItemId,
  });
}

// What the price graph shows, per its saved selection of window, suppliers and MRPs; self-gates on the price view
// permission
export function useInventoryItemPriceGraph(inventoryItemId: string) {
  const { available } = usePermission(SITE_INVENTORY_ITEMS.prices.view);
  return useQuery<InventoryItemPriceGraph, AxiosError>({
    queryKey: INVENTORY_ITEM_PRICE_GRAPH_KEY(inventoryItemId),
    queryFn: () => getInventoryItemPriceGraph(inventoryItemId),
    placeholderData: keepPreviousData,
    enabled: available && !!inventoryItemId,
  });
}

// Saves a new graph selection; the controls take it at once, then the graph refetches
export function useSaveInventoryItemPriceGraph(inventoryItemId: string) {
  const queryClient = useQueryClient();
  const queryKey = INVENTORY_ITEM_PRICE_GRAPH_KEY(inventoryItemId);
  return useMutation<void, AxiosError, PriceGraphSelection>({
    mutationFn: (selection) => saveInventoryItemPriceGraph(inventoryItemId, selection),
    onMutate: (selection) => {
      queryClient.setQueryData<InventoryItemPriceGraph>(queryKey, (graph) => (graph ? { ...graph, selection } : graph));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
