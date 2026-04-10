import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { StockTransferData, StockTransferStatus, StockTransfersTableResponse } from '@/schemas/stock-transfers';

export interface CreateStockTransferPayload {
  inventoryItemId: string;
  fromBuId: string;
  toBuId: string;
  quantity: number;
  notes?: string;
}

export function getStockTransfersTable(): Promise<StockTransfersTableResponse> {
  return axios
    .get<StockTransfersTableResponse>('commerce-api/stock-transfers/table', { showSuccessToast: false })
    .then((r) => r.data);
}

export function createStockTransfer(data: CreateStockTransferPayload): Promise<StockTransferData> {
  return axios
    .post<StockTransferData>('commerce-api/stock-transfers', data)
    .then((r) => r.data);
}

export function getStockTransfer(id: string): Promise<StockTransferData> {
  return axios
    .get<StockTransferData>(`commerce-api/stock-transfers/${id}`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function updateStockTransferStatus({ id, status }: { id: string; status: StockTransferStatus }): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/stock-transfers/${id}/status`, { status })
    .then((r) => r.data);
}
