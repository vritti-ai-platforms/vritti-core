import axios from '@vritti/quantum-ui/axios';
import type { StockAdjustmentData, StockAdjustmentsTableResponse } from '@/schemas/stock-adjustments';

export interface CreateStockAdjustmentPayload {
  inventoryItemId: string;
  locationId: string;
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
