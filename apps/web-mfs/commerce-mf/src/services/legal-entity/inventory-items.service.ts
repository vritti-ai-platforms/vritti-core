import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { InventoryItemMrpTableResponse } from '@/schemas/inventory-item-mrp';
import type { InventoryItemData, InventoryItemTableResponse } from '@/schemas/inventory-items';
import type {
  BlockSiteItemFormData,
  InventoryItemSiteData,
  ReplenishmentPayload,
  SiteItemsTableResponse,
} from '@/schemas/site-items';
import type {
  AddInventoryItemSupplierPayload,
  InventoryItemPriceHistory,
  InventoryItemSuppliersTableResponse,
  ItemSupplierPriceComparisonTableResponse,
  SupplierItemData,
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

// The legal entity's sites with how each carries the item and the stock it holds, for the data table
export function getLeSiteItemsTable(id: string): Promise<SiteItemsTableResponse> {
  return axios.get<SiteItemsTableResponse>(`${BASE}/${id}/sites/table`).then((r) => r.data);
}

// Adds the item to one of the legal entity's sites with how the site replenishes it
export function addToLeSite(
  id: string,
  siteId: string,
  data: ReplenishmentPayload,
): Promise<CreateResponse<InventoryItemSiteData>> {
  return axios.post<CreateResponse<InventoryItemSiteData>>(`${BASE}/${id}/sites/${siteId}`, data).then((r) => r.data);
}

// Sets the item up as one of a supplier's items, in a unit and at the enrolled sites that buy it from them
export function addLeInventoryItemSupplier(
  id: string,
  data: AddInventoryItemSupplierPayload,
): Promise<CreateResponse<SupplierItemData>> {
  return axios.post<CreateResponse<SupplierItemData>>(`${BASE}/${id}/suppliers`, data).then((r) => r.data);
}

// Changes how one of the legal entity's sites replenishes the item
export function updateLeSiteReplenishment(
  id: string,
  siteId: string,
  data: ReplenishmentPayload,
): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}/sites/${siteId}`, data).then((r) => r.data);
}

// Stops one of the legal entity's sites buying the item, with why
export function blockLeSiteItem(id: string, siteId: string, data: BlockSiteItemFormData): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/sites/${siteId}/block`, data).then((r) => r.data);
}

// Lets one of the legal entity's sites buy the item again
export function unblockLeSiteItem(id: string, siteId: string): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/sites/${siteId}/unblock`).then((r) => r.data);
}

// Ties buying the item at a site to the supplier's item set up there, or leaves it to the site's own rule
export function setLeSiteItemSupplierItemsRequired(
  id: string,
  siteId: string,
  required: boolean,
): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`${BASE}/${id}/sites/${siteId}/supplier-items-required`, { required })
    .then((r) => r.data);
}

// Removes the item from a site; rejected while the site still holds stock or has open purchases for it
export function removeFromLeSite(id: string, siteId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${id}/sites/${siteId}`).then((r) => r.data);
}
