import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { StockAdjustmentData, StockAdjustmentsTableResponse } from '@/schemas/stock-adjustments';

export interface CreateStockAdjustmentPayload {
  inventoryItemId: string;
  locationId?: string;
  batchId?: string;
  batchNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  type: string;
  quantity: number;
  reason?: string;
}

export function getStockAdjustmentsTable(): Promise<StockAdjustmentsTableResponse> {
  return axios
    .get<StockAdjustmentsTableResponse>('commerce-api/stock-adjustments/table', { showSuccessToast: false })
    .then((r) => r.data);
}

export function createStockAdjustment(data: CreateStockAdjustmentPayload): Promise<StockAdjustmentData> {
  return axios
    .post<StockAdjustmentData>('commerce-api/stock-adjustments', data)
    .then((r) => r.data);
}

export function deleteStockAdjustment(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/stock-adjustments/${id}`).then((r) => r.data);
}
