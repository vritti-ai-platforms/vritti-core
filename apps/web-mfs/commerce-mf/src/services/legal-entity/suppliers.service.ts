import axios from '@vritti/quantum-ui/axios';
import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  AddSupplierSiteItemPayload,
  BulkSetSupplierSiteItemPreferredPayload,
  SupplierData,
  SupplierDetail,
  SupplierItemData,
  SupplierItemDetail,
  SupplierItemPriceHistory,
  SupplierItemPriceRow,
  SupplierItemPricesTableResponse,
  SupplierItemsTableResponse,
  SupplierSiteItemRow,
  SupplierSiteItemsTableResponse,
  SuppliersTableResponse,
  UpdateSupplierSiteItemPayload,
} from '@/schemas/suppliers';

export interface CreateSupplierPayload {
  partyId: string;
  code: string;
  currencyCode: string;
  currencyCodes: string[];
  defaultPaymentTermId: string;
  notes?: string;
  purchasingBlocked: boolean;
  paymentBlocked: boolean;
  isActive: boolean;
}

export interface UpdateSupplierPayload {
  partyId?: string;
  code?: string;
  notes?: string | null;
}

export interface AddSupplierItemPayload {
  inventoryItemId: string;
  supplierItemCode?: string;
  uomId: string;
  minOrderQuantity?: number;
  defaultLeadTimeDays: number;
  siteIds: string[];
}

export interface UpdateSupplierItemPayload {
  supplierItemCode?: string | null;
  uomId?: string;
  minOrderQuantity?: number | null;
  defaultLeadTimeDays?: number;
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

// Sets the payment term new enrollments of a supplier start from
export function setSupplierDefaultPaymentTerm({
  id,
  defaultPaymentTermId,
}: {
  id: string;
  defaultPaymentTermId: string;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/le/suppliers/${id}/default-payment-term`, { defaultPaymentTermId })
    .then((r) => r.data);
}

// Sets the default payment term of several suppliers in a single request
export function bulkSetSupplierDefaultPaymentTerm({
  ids,
  defaultPaymentTermId,
}: {
  ids: string[];
  defaultPaymentTermId: string;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>('commerce-api/le/suppliers/default-payment-term', { ids, defaultPaymentTermId })
    .then((r) => r.data);
}

// Blocks or unblocks new purchase orders and goods receipts from a supplier
export function setSupplierPurchasingBlocked({
  id,
  purchasingBlocked,
}: {
  id: string;
  purchasingBlocked: boolean;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/le/suppliers/${id}/purchasing-blocked`, { purchasingBlocked })
    .then((r) => r.data);
}

// Blocks or unblocks payments to a supplier
export function setSupplierPaymentBlocked({
  id,
  paymentBlocked,
}: {
  id: string;
  paymentBlocked: boolean;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/le/suppliers/${id}/payment-blocked`, { paymentBlocked })
    .then((r) => r.data);
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
export function bulkSetSupplierSiteItemPreferred({
  supplierId,
  ...data
}: BulkSetSupplierSiteItemPreferredPayload & { supplierId: string }): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/le/suppliers/${supplierId}/site-items/preferred`, data)
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

// Sets the default lead time of supplier items in a single request; their sites that follow the item take it too
export function bulkSetSupplierItemDefaultLeadTime({
  supplierId,
  supplierItemIds,
  defaultLeadTimeDays,
}: {
  supplierId: string;
  supplierItemIds: string[];
  defaultLeadTimeDays: number;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/le/suppliers/${supplierId}/items/default-lead-time`, {
      supplierItemIds,
      defaultLeadTimeDays,
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

// Fetches a supplier item's price timeline at the site in the table's context
export function getSupplierItemPricesTable(
  supplierId: string,
  itemId: string,
): Promise<SupplierItemPricesTableResponse> {
  return axios
    .get<SupplierItemPricesTableResponse>(`commerce-api/le/suppliers/${supplierId}/items/${itemId}/prices/table`)
    .then((r) => r.data);
}

// Fetches a supplier item's price windows in a date range at the given sites — every priced site when none are given
export function getSupplierItemPriceHistory(supplierId: string, itemId: string): Promise<SupplierItemPriceHistory> {
  return axios
    .get<SupplierItemPriceHistory>(`commerce-api/le/suppliers/${supplierId}/items/${itemId}/price-history`, {
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

// Fetches the sites a supplier item is set up at
export function getSupplierSiteItemsTable({
  supplierId,
  itemId,
}: {
  supplierId: string;
  itemId: string;
}): Promise<SupplierSiteItemsTableResponse> {
  return axios
    .get<SupplierSiteItemsTableResponse>(`commerce-api/le/suppliers/${supplierId}/items/${itemId}/site-items/table`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

// Sets a supplier item up at a site
export function addSupplierSiteItem({
  supplierId,
  itemId,
  data,
}: {
  supplierId: string;
  itemId: string;
  data: AddSupplierSiteItemPayload;
}): Promise<SupplierSiteItemRow> {
  return axios
    .post<CreateResponse<SupplierSiteItemRow>>(
      `commerce-api/le/suppliers/${supplierId}/items/${itemId}/site-items`,
      data,
    )
    .then((r) => r.data.data);
}

// Updates a supplier item's setup at a site
export function updateSupplierSiteItem({
  supplierId,
  itemId,
  supplierSiteItemId,
  data,
}: {
  supplierId: string;
  itemId: string;
  supplierSiteItemId: string;
  data: UpdateSupplierSiteItemPayload;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(
      `commerce-api/le/suppliers/${supplierId}/items/${itemId}/site-items/${supplierSiteItemId}`,
      data,
    )
    .then((r) => r.data);
}

// Removes a supplier item's setup at a site
export function deleteSupplierSiteItem({
  supplierId,
  itemId,
  supplierSiteItemId,
}: {
  supplierId: string;
  itemId: string;
  supplierSiteItemId: string;
}): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/le/suppliers/${supplierId}/items/${itemId}/site-items/${supplierSiteItemId}`)
    .then((r) => r.data);
}
