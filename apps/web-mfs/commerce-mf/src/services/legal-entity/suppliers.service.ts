import axios from '@vritti/quantum-ui/axios';
import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { SupplierAtSiteData } from '@/schemas/site-suppliers';
import type {
  SiteSupplierItemDetail,
  SiteSupplierItemsTableResponse,
  SupplierData,
  SupplierDetail,
  SupplierItemData,
  SupplierItemDetail,
  SupplierItemPriceHistory,
  SupplierItemPriceRow,
  SupplierItemPricesTableResponse,
  SupplierItemSiteRow,
  SupplierItemSitesTableResponse,
  SupplierItemsTableResponse,
  SupplierSiteRow,
  SupplierSitesTableResponse,
  SuppliersTableResponse,
} from '@/schemas/suppliers';
import type { PriceRange } from '@/utils/supplierPrice';

export interface CreateSupplierPayload {
  partyId: string;
  code: string;
  currencyCode: string;
  defaultPaymentTermId?: string;
  notes?: string;
  purchasingBlocked?: boolean;
  paymentBlocked?: boolean;
  orderEmail?: string | null;
  orderPhone?: string | null;
  isActive?: boolean;
}

export interface UpdateSupplierPayload {
  partyId?: string;
  code?: string;
  defaultPaymentTermId?: string | null;
  notes?: string | null;
  purchasingBlocked?: boolean;
  paymentBlocked?: boolean;
  orderEmail?: string | null;
  orderPhone?: string | null;
}

export interface AddSupplierItemPayload {
  inventoryItemId: string;
  supplierItemCode?: string;
  uomId: string;
  siteIds: string[];
}

export interface UpdateSupplierItemPayload {
  supplierItemCode?: string | null;
  uomId?: string;
}

// Fetches suppliers for the data table
export function getSuppliersTable(): Promise<SuppliersTableResponse> {
  return axios
    .get<SuppliersTableResponse>('commerce-api/le/suppliers/table', { showSuccessToast: false })
    .then((r) => r.data);
}

// Creates a new supplier
export function createSupplier(data: CreateSupplierPayload): Promise<SupplierData> {
  return axios.post<SupplierData>('commerce-api/le/suppliers', data).then((r) => r.data);
}

// Fetches supplier detail with linked items
export function getSupplier(id: string): Promise<SupplierDetail> {
  return axios.get<SupplierDetail>(`commerce-api/le/suppliers/${id}`, { showSuccessToast: false }).then((r) => r.data);
}

// Fetches linked supplier items for the table
export function getSupplierItemsTable(supplierId: string): Promise<SupplierItemsTableResponse> {
  return axios
    .get<SupplierItemsTableResponse>(`commerce-api/le/suppliers/${supplierId}/items/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Updates a supplier
export function updateSupplier({ id, data }: { id: string; data: UpdateSupplierPayload }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/le/suppliers/${id}`, data).then((r) => r.data);
}

// Activates or deactivates several suppliers in a single request
export function bulkSetSupplierActive({
  ids,
  isActive,
}: {
  ids: string[];
  isActive: boolean;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>('commerce-api/le/suppliers/active', { ids, isActive }).then((r) => r.data);
}

// Activates or deactivates a supplier
export function setSupplierActive({ id, isActive }: { id: string; isActive: boolean }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/le/suppliers/${id}/active`, { isActive }).then((r) => r.data);
}

// Deletes a supplier
export function deleteSupplier(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/le/suppliers/${id}`).then((r) => r.data);
}

// Adds an inventory item to a supplier
export function addSupplierItem({
  supplierId,
  data,
}: {
  supplierId: string;
  data: AddSupplierItemPayload;
}): Promise<SupplierItemData> {
  return axios
    .post<CreateResponse<SupplierItemData>>(`commerce-api/le/suppliers/${supplierId}/items`, data)
    .then((r) => r.data.data);
}

// Updates a supplier item link
export function updateSupplierItem({
  supplierId,
  itemId,
  data,
}: {
  supplierId: string;
  itemId: string;
  data: UpdateSupplierItemPayload;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/le/suppliers/${supplierId}/items/${itemId}`, data)
    .then((r) => r.data);
}

// Unlinks an inventory item from a supplier
export function unlinkSupplierItem({
  supplierId,
  itemId,
}: {
  supplierId: string;
  itemId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/le/suppliers/${supplierId}/items/${itemId}`).then((r) => r.data);
}

// Marks supplier items preferred (or not) at the chosen sites in a single request
export function bulkSetSupplierItemPreferred({
  supplierId,
  supplierItemIds,
  siteIds,
  isPreferred,
}: {
  supplierId: string;
  supplierItemIds: string[];
  siteIds: string[];
  isPreferred: boolean;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/le/suppliers/${supplierId}/items/preferred`, {
      supplierItemIds,
      siteIds,
      isPreferred,
    })
    .then((r) => r.data);
}

// Sets (or clears) the minimum order of supplier items in a single request
export function bulkSetSupplierItemMinOrder({
  supplierId,
  supplierItemIds,
  minOrderQuantity,
}: {
  supplierId: string;
  supplierItemIds: string[];
  minOrderQuantity: number | null;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/le/suppliers/${supplierId}/items/min-order`, {
      supplierItemIds,
      minOrderQuantity,
    })
    .then((r) => r.data);
}

// Sets (or clears) the lead time of supplier items in a single request; their sites that follow the item take it too
export function bulkSetSupplierItemLeadTime({
  supplierId,
  supplierItemIds,
  leadTimeDays,
}: {
  supplierId: string;
  supplierItemIds: string[];
  leadTimeDays: number | null;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/le/suppliers/${supplierId}/items/lead-time`, {
      supplierItemIds,
      leadTimeDays,
    })
    .then((r) => r.data);
}

export interface ChangeSupplierCurrencyPayload {
  currencyCode: string;
  conversionRate?: number;
}

// Changes the supplier's currency and reprices all catalog items atomically
export function changeSupplierCurrency(id: string, data: ChangeSupplierCurrencyPayload): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`commerce-api/le/suppliers/${id}/change-currency`, data).then((r) => r.data);
}

export interface AddSupplierSitePayload {
  siteId: string;
  paymentTermId: string;
  partyTaxRegistrationId: string;
  partyBankAccountId?: string | null;
  orderRelationshipId?: string | null;
}

export interface UpdateSupplierSitePayload {
  paymentTermId?: string;
  partyTaxRegistrationId?: string;
  partyBankAccountId?: string | null;
  orderRelationshipId?: string | null;
}

export interface AddSupplierItemPricePayload {
  siteIds: string[];
  unitPrice?: CurrencyValue;
  mrpId?: string;
  schemeBuyQty?: number;
  schemeFreeQty?: number;
  taxInclusive?: boolean;
  validFrom: string;
  validTo?: string | null;
  note?: string;
}

export interface UpdateSupplierItemPricePayload {
  unitPrice?: CurrencyValue;
  mrpId?: string | null;
  schemeBuyQty?: number | null;
  schemeFreeQty?: number | null;
  taxInclusive?: boolean;
  validTo?: string | null;
}

export interface AddSupplierItemSitePayload {
  siteId: string;
  isPreferred?: boolean;
  leadTimeDays?: number;
}

export interface UpdateSupplierItemSitePayload {
  isPreferred?: boolean;
  leadTimeDays?: number | null;
  followItemLeadTime?: boolean;
}

// Fetches enrolled sites for a supplier
export function getSupplierSitesTable(supplierId: string): Promise<SupplierSitesTableResponse> {
  return axios
    .get<SupplierSitesTableResponse>(`commerce-api/le/suppliers/${supplierId}/sites/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Enrolls a site for a supplier
export function addSupplierSite({
  supplierId,
  data,
}: {
  supplierId: string;
  data: AddSupplierSitePayload;
}): Promise<SupplierSiteRow> {
  return axios
    .post<CreateResponse<SupplierSiteRow>>(`commerce-api/le/suppliers/${supplierId}/sites`, data)
    .then((r) => r.data.data);
}

// Updates a supplier site enrollment
export function updateSupplierSite({
  supplierId,
  siteRowId,
  data,
}: {
  supplierId: string;
  siteRowId: string;
  data: UpdateSupplierSitePayload;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/le/suppliers/${supplierId}/sites/${siteRowId}`, data)
    .then((r) => r.data);
}

// Removes a supplier site enrollment
export function removeSupplierSite({
  supplierId,
  siteRowId,
}: {
  supplierId: string;
  siteRowId: string;
}): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/le/suppliers/${supplierId}/sites/${siteRowId}`)
    .then((r) => r.data);
}

// Fetches a single supplier item with detail
export function getSupplierItem({
  supplierId,
  itemId,
}: {
  supplierId: string;
  itemId: string;
}): Promise<SupplierItemDetail> {
  return axios
    .get<SupplierItemDetail>(`commerce-api/le/suppliers/${supplierId}/items/${itemId}`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches the price timeline of a supplier item — every site's rows, or one site's when given
export function getSupplierItemPricesTable({
  supplierId,
  itemId,
  siteId,
}: {
  supplierId: string;
  itemId: string;
  siteId?: string;
}): Promise<SupplierItemPricesTableResponse> {
  return axios
    .get<SupplierItemPricesTableResponse>(
      siteId
        ? `commerce-api/le/suppliers/${supplierId}/sites/${siteId}/items/${itemId}/prices/table`
        : `commerce-api/le/suppliers/${supplierId}/items/${itemId}/prices/table`,
      { showSuccessToast: false },
    )
    .then((r) => r.data);
}

// Fetches every price window of a supplier item grouped by site — unpaged, for charts
export function getSupplierItemPriceHistory({
  supplierId,
  itemId,
  siteIds,
  range,
}: {
  supplierId: string;
  itemId: string;
  siteIds?: string[];
  range: PriceRange;
}): Promise<SupplierItemPriceHistory> {
  return axios
    .get<SupplierItemPriceHistory>(`commerce-api/le/suppliers/${supplierId}/items/${itemId}/prices/history`, {
      params: { ...(siteIds?.length ? { siteIds: siteIds.join(',') } : {}), from: range.from, to: range.to },
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

// Fetches a supplier as one of the LE's sites sees it
export function getSupplierAtSite({
  supplierId,
  siteId,
}: {
  supplierId: string;
  siteId: string;
}): Promise<SupplierAtSiteData> {
  return axios
    .get<SupplierAtSiteData>(`commerce-api/le/suppliers/${supplierId}/sites/${siteId}`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches a supplier's items carried by one of the LE's sites
export function getSupplierSiteItemsTable({
  supplierId,
  siteId,
}: {
  supplierId: string;
  siteId: string;
}): Promise<SiteSupplierItemsTableResponse> {
  return axios
    .get<SiteSupplierItemsTableResponse>(`commerce-api/le/suppliers/${supplierId}/sites/${siteId}/items/table`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

// Fetches a supplier item as one of the LE's sites carries it
export function getSupplierSiteItem({
  supplierId,
  siteId,
  itemId,
}: {
  supplierId: string;
  siteId: string;
  itemId: string;
}): Promise<SiteSupplierItemDetail> {
  return axios
    .get<SiteSupplierItemDetail>(`commerce-api/le/suppliers/${supplierId}/sites/${siteId}/items/${itemId}`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

// Adds a price record to a supplier item's timeline
export function addSupplierItemPrice({
  supplierId,
  itemId,
  data,
}: {
  supplierId: string;
  itemId: string;
  data: AddSupplierItemPricePayload;
}): Promise<SupplierItemPriceRow[]> {
  return axios
    .post<CreateResponse<SupplierItemPriceRow[]>>(
      `commerce-api/le/suppliers/${supplierId}/items/${itemId}/prices`,
      data,
    )
    .then((r) => r.data.data);
}

// Updates a supplier item price record
export function updateSupplierItemPrice({
  supplierId,
  itemId,
  priceId,
  data,
}: {
  supplierId: string;
  itemId: string;
  priceId: string;
  data: UpdateSupplierItemPricePayload;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/le/suppliers/${supplierId}/items/${itemId}/prices/${priceId}`, data)
    .then((r) => r.data);
}

// Deletes a supplier item price record
export function deleteSupplierItemPrice({
  supplierId,
  itemId,
  priceId,
}: {
  supplierId: string;
  itemId: string;
  priceId: string;
}): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/le/suppliers/${supplierId}/items/${itemId}/prices/${priceId}`)
    .then((r) => r.data);
}

// Fetches per-site overrides of a supplier item
export function getSupplierItemSitesTable({
  supplierId,
  itemId,
}: {
  supplierId: string;
  itemId: string;
}): Promise<SupplierItemSitesTableResponse> {
  return axios
    .get<SupplierItemSitesTableResponse>(`commerce-api/le/suppliers/${supplierId}/items/${itemId}/sites/table`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

// Adds a per-site override to a supplier item
export function addSupplierItemSite({
  supplierId,
  itemId,
  data,
}: {
  supplierId: string;
  itemId: string;
  data: AddSupplierItemSitePayload;
}): Promise<SupplierItemSiteRow> {
  return axios
    .post<CreateResponse<SupplierItemSiteRow>>(`commerce-api/le/suppliers/${supplierId}/items/${itemId}/sites`, data)
    .then((r) => r.data.data);
}

// Updates a supplier item's per-site override
export function updateSupplierItemSite({
  supplierId,
  itemId,
  rowId,
  data,
}: {
  supplierId: string;
  itemId: string;
  rowId: string;
  data: UpdateSupplierItemSitePayload;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/le/suppliers/${supplierId}/items/${itemId}/sites/${rowId}`, data)
    .then((r) => r.data);
}

// Deletes a supplier item's per-site override
export function deleteSupplierItemSite({
  supplierId,
  itemId,
  rowId,
}: {
  supplierId: string;
  itemId: string;
  rowId: string;
}): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/le/suppliers/${supplierId}/items/${itemId}/sites/${rowId}`)
    .then((r) => r.data);
}
