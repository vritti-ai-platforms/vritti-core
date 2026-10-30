import axios from '@vritti/quantum-ui/axios';
import type { InventoryItemMrpData } from '@/schemas/inventory-item-mrp';
import type { InventoryItemData, InventoryItemTableResponse } from '@/schemas/inventory-items';
import type {
  InventoryItemPriceGraph,
  InventoryItemSuppliersTableResponse,
  ItemSupplierPriceComparisonTableResponse,
  PriceGraphSelection,
  PricesTableContext,
} from '@/schemas/suppliers';
import { priceGraphState } from '@/utils/supplierPrice';

const BASE = 'commerce-api/le/inventory-items';

export function getLeInventoryItemsTable(): Promise<InventoryItemTableResponse> {
  return axios.get<InventoryItemTableResponse>(`${BASE}/table`).then((r) => r.data);
}

export function getLeInventoryItem(id: string): Promise<InventoryItemData> {
  return axios.get<InventoryItemData>(`${BASE}/${id}`, { showSuccessToast: false }).then((r) => r.data);
}

export function getLeInventoryItemSuppliersTable(id: string): Promise<InventoryItemSuppliersTableResponse> {
  return axios
    .get<InventoryItemSuppliersTableResponse>(`${BASE}/${id}/suppliers/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function getLeInventoryItemMrp(id: string): Promise<InventoryItemMrpData[]> {
  return axios.get<InventoryItemMrpData[]>(`${BASE}/${id}/mrp`, { showSuccessToast: false }).then((r) => r.data);
}

export function getLeInventoryItemPriceGraph(id: string): Promise<InventoryItemPriceGraph> {
  return axios
    .get<InventoryItemPriceGraph>(`${BASE}/${id}/prices/graph`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function getLeInventoryItemPricesTable(
  id: string,
  context: PricesTableContext,
): Promise<ItemSupplierPriceComparisonTableResponse> {
  return axios
    .get<ItemSupplierPriceComparisonTableResponse>(`${BASE}/${id}/prices/table`, {
      params: { asOf: context.asOf, ...(context.site ? { site: context.site } : {}) },
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

// Saves what the price graph shows to its live table state, which the graph endpoint reads back
export function saveLeInventoryItemPriceGraph(id: string, selection: PriceGraphSelection): Promise<void> {
  return axios
    .post(
      'table-states',
      {
        tableSlug: `commerce-le-inventory-item-${id}-price-graph`,
        state: priceGraphState(selection),
        activeViewId: null,
      },
      { showSuccessToast: false },
    )
    .then(() => undefined);
}
