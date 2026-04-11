import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { CreateInventoryItemFormData, InventoryItemData, InventoryItemsTableResponse, InventoryLedgerData, InventoryLevelData, UpdateInventoryItemFormData } from '@/schemas/inventory-items';

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

// Fetches stock levels for an inventory item
export function getInventoryItemLevels(id: string): Promise<InventoryLevelData[]> {
  return axios.get<InventoryLevelData[]>(`commerce-api/inventory-items/${id}/levels`).then((r) => r.data);
}

// Fetches ledger entries for an inventory item
export function getInventoryItemLedger(id: string): Promise<InventoryLedgerData[]> {
  return axios.get<InventoryLedgerData[]>(`commerce-api/inventory-items/${id}/ledger`).then((r) => r.data);
}

// Updates an inventory item
export function updateInventoryItem({ id, data }: { id: string; data: UpdateInventoryItemFormData }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/inventory-items/${id}`, data).then((r) => r.data);
}

// Deletes an inventory item
export function deleteInventoryItem(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/inventory-items/${id}`).then((r) => r.data);
}
