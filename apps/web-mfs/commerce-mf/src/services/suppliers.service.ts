import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type {
  SupplierContactData,
  SupplierData,
  SupplierDetail,
  SupplierItemData,
  SupplierItemsTableResponse,
  SuppliersTableResponse,
} from '@/schemas/suppliers';

export interface CreateSupplierPayload {
  name: string;
  code: string;
  currencyCode: string;
  primaryContact: {
    name: string;
    phone: string;
    alternatePhone?: string;
    email?: string;
    alternateEmail?: string;
    designation?: string;
  };
  website?: string;
  address?: string;
  taxId?: string;
  taxIdType?: 'GST' | 'VAT' | 'EIN' | 'SALES_TAX' | 'OTHER';
  paymentTerms?: string;
  leadTimeDays?: number;
  notes?: string;
}

export interface UpdateSupplierPayload {
  name?: string;
  code?: string;
  website?: string | null;
  address?: string | null;
  taxId?: string | null;
  taxIdType?: 'GST' | 'VAT' | 'EIN' | 'SALES_TAX' | 'OTHER' | null;
  paymentTerms?: string | null;
  leadTimeDays?: number | null;
  notes?: string | null;
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
}

export interface UpdateSupplierItemPayload {
  supplierItemCode?: string | null;
  unitPrice?: { currency: string; value: string } | null;
  uomId?: string;
  minOrderQuantity?: number | null;
  leadTimeDays?: number | null;
  isPreferred?: boolean;
  isActive?: boolean;
}

export interface CreateSupplierContactPayload {
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  alternateEmail?: string;
  designation?: string;
  notes?: string;
  isPrimary?: boolean;
}

export interface UpdateSupplierContactPayload {
  name?: string;
  phone: string;
  alternatePhone?: string | null;
  email?: string | null;
  alternateEmail?: string | null;
  designation?: string | null;
  notes?: string | null;
  isPrimary?: boolean;
  isActive?: boolean;
}

// Fetches suppliers for the data table
export function getSuppliersTable(): Promise<SuppliersTableResponse> {
  return axios
    .get<SuppliersTableResponse>('commerce-api/suppliers/table', { showSuccessToast: false })
    .then((r) => r.data);
}

// Creates a new supplier
export function createSupplier(data: CreateSupplierPayload): Promise<SupplierData> {
  return axios.post<SupplierData>('commerce-api/suppliers', data).then((r) => r.data);
}

// Fetches supplier detail with linked items
export function getSupplier(id: string): Promise<SupplierDetail> {
  return axios.get<SupplierDetail>(`commerce-api/suppliers/${id}`, { showSuccessToast: false }).then((r) => r.data);
}

// Fetches linked supplier items for the table
export function getSupplierItemsTable(supplierId: string): Promise<SupplierItemsTableResponse> {
  return axios
    .get<SupplierItemsTableResponse>(`commerce-api/suppliers/${supplierId}/items/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches linked inventory item IDs for exclusion
export function getSupplierItemIds(supplierId: string): Promise<string[]> {
  return axios
    .get<string[]>(`commerce-api/suppliers/${supplierId}/items/ids`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches contacts for a supplier
export function getSupplierContacts(supplierId: string): Promise<SupplierContactData[]> {
  return axios
    .get<SupplierContactData[]>(`commerce-api/suppliers/${supplierId}/contacts`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Updates a supplier
export function updateSupplier({ id, data }: { id: string; data: UpdateSupplierPayload }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/suppliers/${id}`, data).then((r) => r.data);
}

// Deletes a supplier
export function deleteSupplier(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/suppliers/${id}`).then((r) => r.data);
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
    .post<CreateResponse<SupplierItemData>>(`commerce-api/suppliers/${supplierId}/items`, data)
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
  return axios.patch<SuccessResponse>(`commerce-api/suppliers/${supplierId}/items/${itemId}`, data).then((r) => r.data);
}

// Unlinks an inventory item from a supplier
export function unlinkSupplierItem({
  supplierId,
  itemId,
}: {
  supplierId: string;
  itemId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/suppliers/${supplierId}/items/${itemId}`).then((r) => r.data);
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
    .delete<SuccessResponse>(`commerce-api/suppliers/${supplierId}/items`, { data: { supplierItemIds } })
    .then((r) => r.data);
}

// Adds a contact to a supplier
export function addSupplierContact({
  supplierId,
  data,
}: {
  supplierId: string;
  data: CreateSupplierContactPayload;
}): Promise<SupplierContactData> {
  return axios.post<SupplierContactData>(`commerce-api/suppliers/${supplierId}/contacts`, data).then((r) => r.data);
}

// Updates a supplier contact
export function updateSupplierContact({
  supplierId,
  contactId,
  data,
}: {
  supplierId: string;
  contactId: string;
  data: UpdateSupplierContactPayload;
}): Promise<SupplierContactData> {
  return axios
    .patch<SupplierContactData>(`commerce-api/suppliers/${supplierId}/contacts/${contactId}`, data)
    .then((r) => r.data);
}

// Deletes a supplier contact
export function deleteSupplierContact({
  supplierId,
  contactId,
}: {
  supplierId: string;
  contactId: string;
}): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/suppliers/${supplierId}/contacts/${contactId}`)
    .then((r) => r.data);
}

// Marks a supplier contact as primary
export function markPrimarySupplierContact({
  supplierId,
  contactId,
}: {
  supplierId: string;
  contactId: string;
}): Promise<SupplierContactData> {
  return axios
    .post<SupplierContactData>(`commerce-api/suppliers/${supplierId}/contacts/${contactId}/mark-primary`)
    .then((r) => r.data);
}

export interface ChangeSupplierCurrencyPayload {
  currencyCode: string;
  conversionRate?: number;
}

// Changes the supplier's currency and reprices all catalog items atomically
export function changeSupplierCurrency(id: string, data: ChangeSupplierCurrencyPayload): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`commerce-api/suppliers/${id}/change-currency`, data).then((r) => r.data);
}
