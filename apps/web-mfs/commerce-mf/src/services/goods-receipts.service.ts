import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type {
  GoodsReceiptBatchData,
  GoodsReceiptBatchItemData,
  GoodsReceiptData,
  GoodsReceiptItemData,
  GoodsReceiptItemsTableResponse,
  GoodsReceiptsTableResponse,
} from '@/schemas/goods-receipts';

export interface CreateGoodsReceiptPayload {
  supplierId: string;
  purchaseOrderId?: string;
  receivedDate: string;
  receivedBy?: string;
  notes?: string;
}

export interface AddGoodsReceiptItemPayload {
  inventoryItemId: string;
  acceptedQuantity: number;
  rejectedQuantity?: number;
}

export interface AddGoodsReceiptBatchPayload {
  inventoryItemId: string;
  locationId: string;
  quantity: number;
  lotNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
}

export interface UpdateGoodsReceiptItemPayload {
  acceptedQuantity: number;
  rejectedQuantity: number;
}

export interface UpdateGoodsReceiptBatchPayload extends Partial<AddGoodsReceiptBatchPayload> {}

export interface AddGoodsReceiptBatchItemPayload {
  serialNumber: string;
}

export interface UpdateGoodsReceiptBatchItemPayload {
  serialNumber: string;
}

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

export function createGoodsReceipt(data: CreateGoodsReceiptPayload): Promise<GoodsReceiptData> {
  return axios.post<GoodsReceiptData>('commerce-api/goods-receipts', data).then((r) => r.data);
}

export function getGoodsReceiptInventoryItemIds(id: string): Promise<string[]> {
  return axios
    .get<string[]>(`commerce-api/goods-receipts/${id}/items/inventory-item-ids`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function getGoodsReceiptItems(id: string): Promise<GoodsReceiptItemData[]> {
  return axios.get<GoodsReceiptItemData[]>(`commerce-api/goods-receipts/${id}/items`, { showSuccessToast: false }).then((r) => r.data);
}

export function getGoodsReceiptItemsTable(id: string): Promise<GoodsReceiptItemsTableResponse> {
  return axios
    .get<GoodsReceiptItemsTableResponse>(`commerce-api/goods-receipts/${id}/items/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function getGoodsReceiptItemById(id: string, itemId: string): Promise<GoodsReceiptItemData> {
  return axios
    .get<GoodsReceiptItemData>(`commerce-api/goods-receipts/${id}/items/${itemId}`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function addGoodsReceiptItem(id: string, data: AddGoodsReceiptItemPayload): Promise<GoodsReceiptItemData> {
  return axios
    .post<CreateResponse<GoodsReceiptItemData>>(`commerce-api/goods-receipts/${id}/items`, data)
    .then((r) => r.data.data);
}

export function updateGoodsReceiptItem(
  id: string,
  itemId: string,
  data: UpdateGoodsReceiptItemPayload,
): Promise<GoodsReceiptItemData> {
  return axios
    .patch<GoodsReceiptItemData>(`commerce-api/goods-receipts/${id}/items/${itemId}`, data)
    .then((r) => r.data);
}

export function removeGoodsReceiptItem(id: string, itemId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/goods-receipts/${id}/items/${itemId}`).then((r) => r.data);
}

export function getGoodsReceiptBatches(id: string, itemId: string): Promise<GoodsReceiptBatchData[]> {
  return axios
    .get<GoodsReceiptBatchData[]>(`commerce-api/goods-receipts/${id}/items/${itemId}/batches`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function addGoodsReceiptBatch(
  id: string,
  itemId: string,
  data: AddGoodsReceiptBatchPayload,
): Promise<GoodsReceiptBatchData> {
  return axios
    .post<CreateResponse<GoodsReceiptBatchData>>(`commerce-api/goods-receipts/${id}/items/${itemId}/batches`, data)
    .then((r) => r.data.data);
}

export function updateGoodsReceiptBatch(
  id: string,
  itemId: string,
  batchId: string,
  data: UpdateGoodsReceiptBatchPayload,
): Promise<GoodsReceiptBatchData> {
  return axios
    .patch<GoodsReceiptBatchData>(`commerce-api/goods-receipts/${id}/items/${itemId}/batches/${batchId}`, data)
    .then((r) => r.data);
}

export function removeGoodsReceiptBatch(id: string, itemId: string, batchId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/goods-receipts/${id}/items/${itemId}/batches/${batchId}`).then((r) => r.data);
}

export function getGoodsReceiptBatchItems(id: string, itemId: string, batchId: string): Promise<GoodsReceiptBatchItemData[]> {
  return axios
    .get<GoodsReceiptBatchItemData[]>(`commerce-api/goods-receipts/${id}/items/${itemId}/batches/${batchId}/items`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

export function addGoodsReceiptBatchItem(
  id: string,
  itemId: string,
  batchId: string,
  data: AddGoodsReceiptBatchItemPayload,
): Promise<GoodsReceiptBatchItemData> {
  return axios
    .post<GoodsReceiptBatchItemData>(`commerce-api/goods-receipts/${id}/items/${itemId}/batches/${batchId}/items`, data)
    .then((r) => r.data);
}

export function updateGoodsReceiptBatchItem(
  id: string,
  itemId: string,
  batchId: string,
  subItemId: string,
  data: AddGoodsReceiptBatchItemPayload,
): Promise<GoodsReceiptBatchItemData> {
  return axios
    .patch<GoodsReceiptBatchItemData>(
      `commerce-api/goods-receipts/${id}/items/${itemId}/batches/${batchId}/items/${subItemId}`,
      data,
    )
    .then((r) => r.data);
}

export function removeGoodsReceiptBatchItem(
  id: string,
  itemId: string,
  batchId: string,
  subItemId: string,
): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/goods-receipts/${id}/items/${itemId}/batches/${batchId}/items/${subItemId}`)
    .then((r) => r.data);
}

export function publishGoodsReceipt(id: string): Promise<GoodsReceiptData> {
  return axios.post<GoodsReceiptData>(`commerce-api/goods-receipts/${id}/publish`).then((r) => r.data);
}

export function startGoodsReceiptAllocation(id: string): Promise<GoodsReceiptData> {
  return axios.post<GoodsReceiptData>(`commerce-api/goods-receipts/${id}/start-allocation`).then((r) => r.data);
}

export function deleteGoodsReceipt(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/goods-receipts/${id}`).then((r) => r.data);
}
