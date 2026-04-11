import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { CreateInventoryItemFormData, InventoryItemData, InventoryItemDetail, InventoryItemsTableResponse, UpdateInventoryItemFormData } from '@/schemas/inventory-items';

// Fetches inventory items for the data table
export function getInventoryItemsTable(): Promise<InventoryItemsTableResponse> {
  return axios.get<InventoryItemsTableResponse>('commerce-api/inventory-items/table').then((r) => r.data);
}

// Creates a new inventory item
export function createInventoryItem(data: CreateInventoryItemFormData): Promise<CreateResponse<InventoryItemData>> {
  return axios.post<CreateResponse<InventoryItemData>>('commerce-api/inventory-items', data).then((r) => r.data);
}

// Fetches inventory item detail with levels and ledger
export function getInventoryItem(id: string): Promise<InventoryItemDetail> {
  return axios.get<InventoryItemDetail>(`commerce-api/inventory-items/${id}`).then((r) => r.data);
}

// Updates an inventory item
export function updateInventoryItem({ id, data }: { id: string; data: UpdateInventoryItemFormData }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/inventory-items/${id}`, data).then((r) => r.data);
}

// Deletes an inventory item
export function deleteInventoryItem(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/inventory-items/${id}`).then((r) => r.data);
}
