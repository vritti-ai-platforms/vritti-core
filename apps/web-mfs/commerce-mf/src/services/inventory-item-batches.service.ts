import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { BatchLedgerTableResponse, InventoryItemBatchData } from '@/schemas/inventory-item-batches';
import type { StockAdjustmentsTableResponse } from '@/schemas/stock-adjustments';

export function getInventoryItemBatch(id: string): Promise<InventoryItemBatchData> {
  return axios.get<InventoryItemBatchData>(`commerce-api/inventory-item-batches/${id}`).then((r) => r.data);
}

export function deleteInventoryItemBatch(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/inventory-item-batches/${id}`).then((r) => r.data);
}

export function getInventoryItemBatchLedgerTable(batchId: string): Promise<BatchLedgerTableResponse> {
  return axios.get<BatchLedgerTableResponse>(`commerce-api/inventory-item-batches/${batchId}/ledger/table`).then((r) => r.data);
}

export function getInventoryItemBatchAdjustmentsTable(batchId: string): Promise<StockAdjustmentsTableResponse> {
  return axios.get<StockAdjustmentsTableResponse>(`commerce-api/inventory-item-batches/${batchId}/adjustments/table`).then((r) => r.data);
}
