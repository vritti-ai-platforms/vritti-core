import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { InventoryItemBatchesTableResponse } from '@/schemas/inventory-item-batches';
import type {
  CreateInventoryItemFormData,
  InventoryItemData,
  InventoryItemStockData,
  InventoryItemsTableResponse,
  UpdateInventoryItemFormData,
} from '@/schemas/inventory-items';
import type { InventoryItemSuppliersTableResponse } from '@/schemas/suppliers';

export function getInventoryItemsTable(): Promise<InventoryItemsTableResponse> {
  return axios.get<InventoryItemsTableResponse>('commerce-api/inventory-items/table').then((r) => r.data);
}

export function createInventoryItem(data: CreateInventoryItemFormData): Promise<CreateResponse<InventoryItemData>> {
  return axios.post<CreateResponse<InventoryItemData>>('commerce-api/inventory-items', data).then((r) => r.data);
}

export function getInventoryItem(id: string): Promise<InventoryItemData> {
  return axios.get<InventoryItemData>(`commerce-api/inventory-items/${id}`).then((r) => r.data);
}

export function getInventoryItemBatchesTable(id: string): Promise<InventoryItemBatchesTableResponse> {
  return axios.get<InventoryItemBatchesTableResponse>(`commerce-api/inventory-items/${id}/batches/table`).then((r) => r.data);
}

export function getInventoryItemStocks(id: string): Promise<InventoryItemStockData[]> {
  return axios.get<InventoryItemStockData[]>(`commerce-api/inventory-items/${id}/stocks`).then((r) => r.data);
}

export function updateInventoryItem({ id, data }: { id: string; data: UpdateInventoryItemFormData }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/inventory-items/${id}`, data).then((r) => r.data);
}

export function deleteInventoryItem(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/inventory-items/${id}`).then((r) => r.data);
}

export function getAllowedUomIds(id: string): Promise<string[]> {
  return axios
    .get<string[]>(`commerce-api/inventory-items/${id}/allowed-uom-ids`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function getInventoryItemSuppliersTable(id: string): Promise<InventoryItemSuppliersTableResponse> {
  return axios
    .get<InventoryItemSuppliersTableResponse>(`commerce-api/inventory-items/${id}/suppliers/table`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}
