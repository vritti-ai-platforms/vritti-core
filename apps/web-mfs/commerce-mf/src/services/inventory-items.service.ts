import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { InventoryItemLotsTableResponse } from '@/schemas/inventory-item-lots';
import type { InventoryItemQuantsTableResponse } from '@/schemas/inventory-item-quants';
import type {
  CreateInventoryItemFormData,
  InventoryItemData,
  InventoryItemLedgerTableResponse,
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

export function getInventoryItemQuantsTable(id: string): Promise<InventoryItemQuantsTableResponse> {
  return axios
    .get<InventoryItemQuantsTableResponse>(`commerce-api/inventory-items/${id}/quants/table`)
    .then((r) => r.data);
}

export function getInventoryItemLotsTable(id: string): Promise<InventoryItemLotsTableResponse> {
  return axios.get<InventoryItemLotsTableResponse>(`commerce-api/inventory-items/${id}/lots/table`).then((r) => r.data);
}

export function getInventoryItemStocks(id: string): Promise<InventoryItemStockData[]> {
  return axios.get<InventoryItemStockData[]>(`commerce-api/inventory-items/${id}/stocks`).then((r) => r.data);
}

export function updateInventoryItem({
  id,
  data,
}: {
  id: string;
  data: UpdateInventoryItemFormData;
}): Promise<SuccessResponse> {
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

export function getInventoryItemLedgerTable(id: string): Promise<InventoryItemLedgerTableResponse> {
  return axios
    .get<InventoryItemLedgerTableResponse>(`commerce-api/inventory-items/${id}/ledger/table`)
    .then((r) => r.data);
}
