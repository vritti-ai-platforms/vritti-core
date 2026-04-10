import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { SupplierData, SupplierDetail, SupplierItemData, SuppliersTableResponse } from '@/schemas/suppliers';

export interface CreateSupplierPayload {
  name: string;
  code: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  paymentTerms?: string;
  leadTimeDays?: number;
  notes?: string;
}

export interface UpdateSupplierPayload {
  name?: string;
  code?: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
  paymentTerms?: string | null;
  leadTimeDays?: number | null;
  notes?: string | null;
}

export interface LinkSupplierItemPayload {
  inventoryItemId: string;
  supplierCode?: string;
  unitPrice?: number;
  uomId?: string;
  minOrderQuantity?: number;
  leadTimeDays?: number;
  isPreferred?: boolean;
}

// Fetches suppliers for the data table
export function getSuppliersTable(): Promise<SuppliersTableResponse> {
  return axios
    .get<SuppliersTableResponse>('commerce-api/suppliers/table', { showSuccessToast: false })
    .then((r) => r.data);
}

// Creates a new supplier
export function createSupplier(data: CreateSupplierPayload): Promise<SupplierData> {
  return axios
    .post<SupplierData>('commerce-api/suppliers', data)
    .then((r) => r.data);
}

// Fetches supplier detail with linked items
export function getSupplier(id: string): Promise<SupplierDetail> {
  return axios
    .get<SupplierDetail>(`commerce-api/suppliers/${id}`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Updates a supplier
export function updateSupplier({ id, data }: { id: string; data: UpdateSupplierPayload }): Promise<SupplierData> {
  return axios
    .patch<SupplierData>(`commerce-api/suppliers/${id}`, data)
    .then((r) => r.data);
}

// Deletes a supplier
export function deleteSupplier(id: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/suppliers/${id}`)
    .then((r) => r.data);
}

// Links an inventory item to a supplier
export function linkSupplierItem({ supplierId, data }: { supplierId: string; data: LinkSupplierItemPayload }): Promise<SupplierItemData> {
  return axios
    .post<SupplierItemData>(`commerce-api/suppliers/${supplierId}/items`, data)
    .then((r) => r.data);
}

// Unlinks an inventory item from a supplier
export function unlinkSupplierItem(itemId: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/supplier-items/${itemId}`)
    .then((r) => r.data);
}
