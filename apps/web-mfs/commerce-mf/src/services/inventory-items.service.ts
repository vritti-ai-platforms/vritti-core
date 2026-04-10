import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { InventoryItemData, InventoryItemDetail, InventoryItemsTableResponse } from '@/schemas/inventory-items';

export interface CreateInventoryItemPayload {
  name: string;
  code: string;
  type: 'MATERIAL' | 'PRODUCT';
  description?: string;
  uomId: string;
  requiresShipping?: boolean;
}

export interface UpdateInventoryItemPayload {
  name?: string;
  code?: string;
  type?: 'MATERIAL' | 'PRODUCT';
  description?: string | null;
  uomId?: string;
  requiresShipping?: boolean;
}

// Fetches inventory items for the data table
export function getInventoryItemsTable(): Promise<InventoryItemsTableResponse> {
  return axios
    .get<InventoryItemsTableResponse>('commerce-api/inventory-items/table', { showSuccessToast: false })
    .then((r) => r.data);
}

// Creates a new inventory item
export function createInventoryItem(data: CreateInventoryItemPayload): Promise<InventoryItemData> {
  return axios
    .post<InventoryItemData>('commerce-api/inventory-items', data)
    .then((r) => r.data);
}

// Fetches inventory item detail with levels and ledger
export function getInventoryItem(id: string): Promise<InventoryItemDetail> {
  return axios
    .get<InventoryItemDetail>(`commerce-api/inventory-items/${id}`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Updates an inventory item
export function updateInventoryItem({ id, data }: { id: string; data: UpdateInventoryItemPayload }): Promise<InventoryItemData> {
  return axios
    .patch<InventoryItemData>(`commerce-api/inventory-items/${id}`, data)
    .then((r) => r.data);
}

// Deletes an inventory item
export function deleteInventoryItem(id: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/inventory-items/${id}`)
    .then((r) => r.data);
}
