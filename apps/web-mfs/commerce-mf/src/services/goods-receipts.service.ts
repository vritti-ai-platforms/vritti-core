import axios from '@vritti/quantum-ui/axios';
import type { GoodsReceiptData, GoodsReceiptsTableResponse } from '@/schemas/goods-receipts';
import type { CreateGoodsReceiptPayload } from './purchase-orders.service';

export type { CreateGoodsReceiptPayload };

export function getGoodsReceiptsTable(): Promise<GoodsReceiptsTableResponse> {
  return axios
    .get<GoodsReceiptsTableResponse>('commerce-api/goods-receipts/table', { showSuccessToast: false })
    .then((r) => r.data);
}

export function getGoodsReceipt(id: string): Promise<GoodsReceiptData> {
  return axios
    .get<GoodsReceiptData>(`commerce-api/goods-receipts/${id}`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function getGoodsReceiptsByPo(poId: string): Promise<GoodsReceiptData[]> {
  return axios
    .get<GoodsReceiptData[]>(`commerce-api/goods-receipts/by-po/${poId}`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function createGoodsReceipt(data: CreateGoodsReceiptPayload): Promise<GoodsReceiptData> {
  return axios.post<GoodsReceiptData>('commerce-api/goods-receipts', data).then((r) => r.data);
}
