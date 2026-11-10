import axios from '@vritti/quantum-ui/axios';
import type { InventoryItemMrpTableResponse } from '@/schemas/inventory-item-mrp';
import type { InventoryItemData, InventoryItemTableResponse } from '@/schemas/inventory-items';
import type {
  InventoryItemPriceHistory,
  InventoryItemSuppliersTableResponse,
  ItemSupplierPriceComparisonTableResponse,
} from '@/schemas/suppliers';

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

export function getLeInventoryItemMrpTable(id: string): Promise<InventoryItemMrpTableResponse> {
  return axios.get<InventoryItemMrpTableResponse>(`${BASE}/${id}/mrp/table`).then((r) => r.data);
}

export function getLeInventoryItemPriceHistory(id: string): Promise<InventoryItemPriceHistory> {
  return axios
    .get<InventoryItemPriceHistory>(`${BASE}/${id}/prices/history`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches every supplier's standing for the item at the site and on the day in the table's context
export function getLeInventoryItemPricesTable(id: string): Promise<ItemSupplierPriceComparisonTableResponse> {
  return axios
    .get<ItemSupplierPriceComparisonTableResponse>(`${BASE}/${id}/prices/table`, { showSuccessToast: false })
    .then((r) => r.data);
}
