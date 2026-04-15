import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type {
  StockAdjustmentData,
  StockAdjustmentLinesTableResponse,
  StockAdjustmentsTableResponse,
  StockAdjustmentType,
} from '@/schemas/stock-adjustments';

export interface CreateStockAdjustmentPayload {
  inventoryItemId: string;
  type: StockAdjustmentType;
  reason: string;
}

export interface AddStockAdjustmentLinePayload {
  batchId?: string;
  locationId?: string;
  quantity: number;
  manufacturingDate?: string;
  expiryDate?: string;
}

export function getStockAdjustmentsTable(): Promise<StockAdjustmentsTableResponse> {
  return axios.get<StockAdjustmentsTableResponse>('commerce-api/stock-adjustments/table').then((r) => r.data);
}

export function getStockAdjustment(id: string): Promise<StockAdjustmentData> {
  return axios.get<StockAdjustmentData>(`commerce-api/stock-adjustments/${id}`).then((r) => r.data);
}

export function getStockAdjustmentLinesTable(id: string): Promise<StockAdjustmentLinesTableResponse> {
  return axios
    .get<StockAdjustmentLinesTableResponse>(`commerce-api/stock-adjustments/${id}/lines/table`)
    .then((r) => r.data);
}

export function createStockAdjustment(data: CreateStockAdjustmentPayload): Promise<StockAdjustmentData> {
  return axios
    .post<CreateResponse<StockAdjustmentData>>('commerce-api/stock-adjustments', data)
    .then((r) => r.data.data);
}

export function addStockAdjustmentLine(id: string, data: AddStockAdjustmentLinePayload): Promise<StockAdjustmentData> {
  return axios.post<StockAdjustmentData>(`commerce-api/stock-adjustments/${id}/lines`, data).then((r) => r.data);
}

export function updateStockAdjustmentLine(
  id: string,
  lineId: string,
  data: Partial<AddStockAdjustmentLinePayload>,
): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/stock-adjustments/${id}/lines/${lineId}`, data).then((r) => r.data);
}

export function removeStockAdjustmentLine(id: string, lineId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/stock-adjustments/${id}/lines/${lineId}`).then((r) => r.data);
}

export function publishStockAdjustment(id: string): Promise<StockAdjustmentData> {
  return axios.post<StockAdjustmentData>(`commerce-api/stock-adjustments/${id}/publish`).then((r) => r.data);
}

export function deleteStockAdjustment(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/stock-adjustments/${id}`).then((r) => r.data);
}
