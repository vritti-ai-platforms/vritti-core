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
import type { BlockSiteItemFormData, InventoryItemSiteData, ReplenishmentPayload } from '@/schemas/site-items';
import type {
  InventoryItemPriceHistory,
  InventoryItemSuppliersTableResponse,
  ItemSupplierPricesTableResponse,
} from '@/schemas/suppliers';

const BASE = 'commerce-api/site/inventory-items';

export function getInventoryItemsStockTable(): Promise<SiteStockTableResponse> {
  return axios.get<SiteStockTableResponse>(`${BASE}/stock-table`).then((r) => r.data);
}

// Adds an item to the current site with how the site replenishes it
export function addToSite(
  inventoryItemId: string,
  data: ReplenishmentPayload,
): Promise<CreateResponse<InventoryItemSiteData>> {
  return axios
    .post<CreateResponse<InventoryItemSiteData>>(`${BASE}/${inventoryItemId}/setup`, data)
    .then((r) => r.data);
}

// Changes how the current site replenishes an item
export function updateReplenishment(inventoryItemId: string, data: ReplenishmentPayload): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${inventoryItemId}/setup`, data).then((r) => r.data);
}

// Stops the current site buying an item, with why
export function blockSiteItem(inventoryItemId: string, data: BlockSiteItemFormData): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${inventoryItemId}/setup/block`, data).then((r) => r.data);
}

// Lets the current site buy an item again
export function unblockSiteItem(inventoryItemId: string): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${inventoryItemId}/setup/unblock`).then((r) => r.data);
}

// How the current site carries an item, or null while it does not
export function getSiteItem(inventoryItemId: string): Promise<InventoryItemSiteData | null> {
  return axios.get<InventoryItemSiteData | null>(`${BASE}/${inventoryItemId}/setup`).then((r) => r.data);
}

// Removes an item from the current site
export function removeFromSite(inventoryItemId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${inventoryItemId}/setup`).then((r) => r.data);
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
