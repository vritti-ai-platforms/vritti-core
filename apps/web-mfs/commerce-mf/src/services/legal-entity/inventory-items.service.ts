import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { InventoryItemMrpTableResponse } from '@/schemas/inventory-item-mrp';
import type { InventoryItemData, InventoryItemTableResponse } from '@/schemas/inventory-items';
import type {
  SiteStockLevelData,
  SiteStockLevelsPayload,
  SiteStockLevelsTableResponse,
} from '@/schemas/site-stock-levels';
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

// Lists every site of the legal entity with the item's stock levels and on-hand quantity there
// The item's stock levels at the legal entity's sites, with the stock each holds, for the data table
export function getLeSiteStockLevelsTable(id: string): Promise<SiteStockLevelsTableResponse> {
  return axios.get<SiteStockLevelsTableResponse>(`${BASE}/${id}/site-stock-levels/table`).then((r) => r.data);
}

export function createLeSiteStockLevels(
  id: string,
  siteId: string,
  data: SiteStockLevelsPayload['data'],
): Promise<CreateResponse<SiteStockLevelData>> {
  return axios
    .post<CreateResponse<SiteStockLevelData>>(`${BASE}/${id}/site-stock-levels/${siteId}`, data)
    .then((r) => r.data);
}

export function updateLeSiteStockLevels(
  id: string,
  siteId: string,
  data: SiteStockLevelsPayload['data'],
): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}/site-stock-levels/${siteId}`, data).then((r) => r.data);
}

// Removes the item's stock levels at a site; rejected while the site still holds stock or has open purchases for it
export function deleteLeSiteStockLevels(id: string, siteId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${id}/site-stock-levels/${siteId}`).then((r) => r.data);
}
