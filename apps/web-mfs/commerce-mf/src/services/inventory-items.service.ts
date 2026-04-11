import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { CreateInventoryItemFormData, InventoryItemData, InventoryItemsTableResponse, InventoryLedgerTableResponse, InventoryLevelsTableResponse, UpdateInventoryItemFormData } from '@/schemas/inventory-items';

// Fetches inventory items for the data table
export function getInventoryItemsTable(): Promise<InventoryItemsTableResponse> {
  return axios.get<InventoryItemsTableResponse>('commerce-api/inventory-items/table').then((r) => r.data);
}

// Creates a new inventory item
export function createInventoryItem(data: CreateInventoryItemFormData): Promise<CreateResponse<InventoryItemData>> {
  return axios.post<CreateResponse<InventoryItemData>>('commerce-api/inventory-items', data).then((r) => r.data);
}

// Fetches a single inventory item
export function getInventoryItem(id: string): Promise<InventoryItemData> {
  return axios.get<InventoryItemData>(`commerce-api/inventory-items/${id}`).then((r) => r.data);
}

// Fetches stock levels table for an inventory item
export function getInventoryItemLevelsTable(id: string): Promise<InventoryLevelsTableResponse> {
  return axios.get<InventoryLevelsTableResponse>(`commerce-api/inventory-items/${id}/levels/table`).then((r) => r.data);
}

// Fetches ledger table for an inventory item
export function getInventoryItemLedgerTable(id: string): Promise<InventoryLedgerTableResponse> {
  return axios.get<InventoryLedgerTableResponse>(`commerce-api/inventory-items/${id}/ledger/table`).then((r) => r.data);
}

// Updates an inventory item
export function updateInventoryItem({ id, data }: { id: string; data: UpdateInventoryItemFormData }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/inventory-items/${id}`, data).then((r) => r.data);
}

// Deletes an inventory item
export function deleteInventoryItem(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/inventory-items/${id}`).then((r) => r.data);
}
