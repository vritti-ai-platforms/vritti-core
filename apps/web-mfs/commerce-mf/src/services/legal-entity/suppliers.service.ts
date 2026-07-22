import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  SupplierData,
  SupplierDetail,
  SupplierItemData,
  SupplierItemDetail,
  SupplierItemPriceRow,
  SupplierItemPricesTableResponse,
  SupplierItemSiteRow,
  SupplierItemSitesTableResponse,
  SupplierItemsTableResponse,
  SupplierSiteRow,
  SupplierSitesTableResponse,
  SuppliersTableResponse,
} from '@/schemas/suppliers';

export interface CreateSupplierPayload {
  partyId: string;
  code: string;
  currencyCode: string;
  paymentTerms?: string;
  leadTimeDays?: number;
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
  paymentTerms?: string | null;
  leadTimeDays?: number | null;
  notes?: string | null;
  purchasingBlocked?: boolean;
  paymentBlocked?: boolean;
  orderEmail?: string | null;
  orderPhone?: string | null;
  isActive?: boolean;
}

export interface AddSupplierItemPayload {
  inventoryItemId: string;
  supplierItemCode?: string;
  unitPrice?: { currency: string; value: string };
  uomId: string;
  minOrderQuantity?: number;
  leadTimeDays?: number;
  isPreferred?: boolean;
  taxInclusive?: boolean;
  schemeBuyQty?: number;
  schemeFreeQty?: number;
  hasScheme?: boolean;
}

export interface UpdateSupplierItemPayload {
  supplierItemCode?: string | null;
  unitPrice?: { currency: string; value: string } | null;
  uomId?: string;
  minOrderQuantity?: number | null;
  leadTimeDays?: number | null;
  isPreferred?: boolean;
  isActive?: boolean;
  taxInclusive?: boolean;
  schemeBuyQty?: number | null;
  schemeFreeQty?: number | null;
  hasScheme?: boolean | null;
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

// Fetches linked inventory item IDs for exclusion
export function getSupplierItemIds(supplierId: string): Promise<string[]> {
  return axios
    .get<string[]>(`commerce-api/le/suppliers/${supplierId}/items/ids`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Updates a supplier
export function updateSupplier({ id, data }: { id: string; data: UpdateSupplierPayload }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/le/suppliers/${id}`, data).then((r) => r.data);
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

// Bulk unlinks multiple supplier items in a single request
export function bulkUnlinkSupplierItems({
  supplierId,
  supplierItemIds,
}: {
  supplierId: string;
  supplierItemIds: string[];
}): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/le/suppliers/${supplierId}/items`, { data: { supplierItemIds } })
    .then((r) => r.data);
}

// Bulk-sets the free-goods scheme on multiple supplier items in a single request
export function bulkSetSupplierItemScheme({
  supplierId,
  supplierItemIds,
  schemeBuyQty,
  schemeFreeQty,
  hasScheme,
}: {
  supplierId: string;
  supplierItemIds: string[];
  schemeBuyQty?: number;
  schemeFreeQty?: number;
  hasScheme: boolean;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/le/suppliers/${supplierId}/items/scheme`, {
      supplierItemIds,
      schemeBuyQty,
      schemeFreeQty,
      hasScheme,
    })
    .then((r) => r.data);
}

// Bulk-marks multiple supplier items as preferred (or clears it) in a single request
export function bulkSetSupplierItemPreferred({
  supplierId,
  supplierItemIds,
  isPreferred,
}: {
  supplierId: string;
  supplierItemIds: string[];
  isPreferred: boolean;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/le/suppliers/${supplierId}/items/preferred`, {
      supplierItemIds,
      isPreferred,
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
  partyTaxRegistrationId?: string | null;
  partyBankAccountId?: string | null;
  orderRelationshipId?: string | null;
}

export interface UpdateSupplierSitePayload {
  partyTaxRegistrationId?: string | null;
  partyBankAccountId?: string | null;
  orderRelationshipId?: string | null;
  isActive?: boolean;
}

export interface AddSupplierItemPricePayload {
  unitPrice?: { currency: string; value: string };
  schemeBuyQty?: number;
  schemeFreeQty?: number;
  validFrom: string;
  validTo?: string | null;
}

export interface UpdateSupplierItemPricePayload {
  unitPrice?: { currency: string; value: string };
  schemeBuyQty?: number | null;
  schemeFreeQty?: number | null;
  validTo?: string | null;
}

export interface AddSupplierItemSitePayload {
  siteId: string;
  leadTimeDays?: number;
  minOrderQuantity?: number;
}

export interface UpdateSupplierItemSitePayload {
  leadTimeDays?: number | null;
  minOrderQuantity?: number | null;
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

// Fetches the price timeline of a supplier item
export function getSupplierItemPricesTable({
  supplierId,
  itemId,
}: {
  supplierId: string;
  itemId: string;
}): Promise<SupplierItemPricesTableResponse> {
  return axios
    .get<SupplierItemPricesTableResponse>(`commerce-api/le/suppliers/${supplierId}/items/${itemId}/prices/table`, {
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
}): Promise<SupplierItemPriceRow> {
  return axios
    .post<CreateResponse<SupplierItemPriceRow>>(`commerce-api/le/suppliers/${supplierId}/items/${itemId}/prices`, data)
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
