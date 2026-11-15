import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { InventoryItemLotsTableResponse } from '@/schemas/inventory-item-lots';
import type { InventoryItemQuantsTableResponse } from '@/schemas/inventory-item-quants';
import type {
  InventoryItemData,
  InventoryItemLedgerTableResponse,
  InventoryItemStockData,
  SiteStockTableResponse,
} from '@/schemas/inventory-items';
import type { ItemStockLevelsData, StockLevelsPayload } from '@/schemas/site-stock-levels';
import type {
  InventoryItemPriceHistory,
  InventoryItemSuppliersTableResponse,
  ItemSupplierPricesTableResponse,
} from '@/schemas/suppliers';

const BASE = 'commerce-api/site/inventory-items';

export function getInventoryItemsStockTable(): Promise<SiteStockTableResponse> {
  return axios.get<SiteStockTableResponse>(`${BASE}/stock-table`).then((r) => r.data);
}

// Sets an item's stock levels at the current site
export function setStockLevels(
  inventoryItemId: string,
  data: StockLevelsPayload,
): Promise<CreateResponse<{ id: string }>> {
  return axios
    .post<CreateResponse<{ id: string }>>(`${BASE}/${inventoryItemId}/stock-levels`, data)
    .then((r) => r.data);
}

// Updates an item's stock levels at the current site
// An item's stock levels at the current site, or null while none are set
export function getStockLevels(inventoryItemId: string): Promise<ItemStockLevelsData | null> {
  return axios.get<ItemStockLevelsData | null>(`${BASE}/${inventoryItemId}/stock-levels`).then((r) => r.data);
}

// Removes an item's stock levels at the current site
export function removeStockLevels(inventoryItemId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${inventoryItemId}/stock-levels`).then((r) => r.data);
}

export function updateStockLevels(inventoryItemId: string, data: StockLevelsPayload): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${inventoryItemId}/stock-levels`, data).then((r) => r.data);
}

export function getInventoryItem(id: string): Promise<InventoryItemData> {
  return axios.get<InventoryItemData>(`${BASE}/${id}`).then((r) => r.data);
}

export function getInventoryItemQuantsTable(id: string): Promise<InventoryItemQuantsTableResponse> {
  return axios.get<InventoryItemQuantsTableResponse>(`${BASE}/${id}/quants/table`).then((r) => r.data);
}

export function getInventoryItemLotsTable(id: string): Promise<InventoryItemLotsTableResponse> {
  return axios.get<InventoryItemLotsTableResponse>(`${BASE}/${id}/lots/table`).then((r) => r.data);
}

export function getInventoryItemStocks(id: string): Promise<InventoryItemStockData[]> {
  return axios.get<InventoryItemStockData[]>(`${BASE}/${id}/stocks`).then((r) => r.data);
}

export function getInventoryItemSuppliersTable(id: string): Promise<InventoryItemSuppliersTableResponse> {
  return axios
    .get<InventoryItemSuppliersTableResponse>(`${BASE}/${id}/suppliers/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function getInventoryItemLedgerTable(id: string): Promise<InventoryItemLedgerTableResponse> {
  return axios.get<InventoryItemLedgerTableResponse>(`${BASE}/${id}/ledger/table`).then((r) => r.data);
}

export function getInventoryItemPricesTable(id: string): Promise<ItemSupplierPricesTableResponse> {
  return axios.get<ItemSupplierPricesTableResponse>(`${BASE}/${id}/prices/table`).then((r) => r.data);
}

export function getInventoryItemPriceHistory(id: string): Promise<InventoryItemPriceHistory> {
  return axios.get<InventoryItemPriceHistory>(`${BASE}/${id}/prices/history`).then((r) => r.data);
}
