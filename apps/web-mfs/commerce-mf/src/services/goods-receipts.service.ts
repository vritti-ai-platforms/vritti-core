import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  GoodsReceiptData,
  GoodsReceiptItemData,
  GoodsReceiptItemQuantsData,
  GoodsReceiptItemsCostData,
  GoodsReceiptItemsTableResponse,
  GoodsReceiptLineData,
  GoodsReceiptLineItemData,
  GoodsReceiptLineItemsTableResponse,
  GoodsReceiptLinesTableResponse,
  GoodsReceiptLotData,
  GoodsReceiptsTableResponse,
  GoodsReceiptTreeNode,
} from '@/schemas/goods-receipts';

export interface CreateGoodsReceiptPayload {
  supplierId: string;
  purchaseOrderId?: string;
  receivedDate: string;
  notes?: string;
  exchangeRate?: number;
}

export interface AddGoodsReceiptItemFromSupplierItemPayload {
  supplierItemId: string;
  orderedQty: number;
  rejectedQuantity?: number;
  unitPrice?: { currency: string; value: string };
  schemeBuyQty?: number;
  schemeFreeQty?: number;
  hasScheme?: boolean;
}

export interface AddGoodsReceiptItemFromPurchaseOrderItemPayload {
  purchaseOrderItemId: string;
  orderedQty: number;
  rejectedQuantity?: number;
  unitPrice?: { currency: string; value: string };
  schemeBuyQty?: number;
  schemeFreeQty?: number;
  hasScheme?: boolean;
}

export interface UpdateGoodsReceiptItemPayload {
  orderedQty?: number;
  rejectedQuantity?: number;
  unitPrice?: { currency: string; value: string };
  schemeBuyQty?: number;
  schemeFreeQty?: number;
  hasScheme?: boolean;
}

export interface AddGoodsReceiptLotPayload {
  lotNumber: string;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
}

export interface UpdateGoodsReceiptLotPayload {
  lotNumber?: string;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
}

export interface AddGoodsReceiptLinePayload {
  goodsReceiptLotId?: string | null;
  locationId: string;
  quantity: number;
}

export interface UpdateGoodsReceiptLinePayload {
  goodsReceiptLotId?: string | null;
  locationId?: string;
  quantity?: number;
}

export interface AddGoodsReceiptLineItemPayload {
  serialNumber: string;
}

// Header

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

export function getGoodsReceiptTree(id: string): Promise<GoodsReceiptTreeNode[]> {
  return axios
    .get<GoodsReceiptTreeNode[]>(`commerce-api/goods-receipts/${id}/tree`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function createGoodsReceipt(data: CreateGoodsReceiptPayload): Promise<GoodsReceiptData> {
  return axios.post<GoodsReceiptData>('commerce-api/goods-receipts', data).then((r) => r.data);
}

export function publishGoodsReceipt(id: string): Promise<GoodsReceiptData> {
  return axios.post<GoodsReceiptData>(`commerce-api/goods-receipts/${id}/publish`).then((r) => r.data);
}

export function linkGoodsReceiptPurchaseOrder(id: string, purchaseOrderId: string): Promise<SuccessResponse> {
  return axios
    .post<SuccessResponse>(`commerce-api/goods-receipts/${id}/link-po`, { purchaseOrderId })
    .then((r) => r.data);
}

export function unlinkGoodsReceiptPurchaseOrder(id: string): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`commerce-api/goods-receipts/${id}/unlink-po`).then((r) => r.data);
}

export function deleteGoodsReceipt(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/goods-receipts/${id}`).then((r) => r.data);
}

// Items

export function getGoodsReceiptInventoryItemIds(id: string): Promise<string[]> {
  return axios
    .get<string[]>(`commerce-api/goods-receipts/${id}/items/inventory-item-ids`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function getGoodsReceiptItemsTable(id: string): Promise<GoodsReceiptItemsTableResponse> {
  return axios
    .get<GoodsReceiptItemsTableResponse>(`commerce-api/goods-receipts/${id}/items/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function getGoodsReceiptItem(id: string, itemId: string): Promise<GoodsReceiptItemData> {
  return axios
    .get<GoodsReceiptItemData>(`commerce-api/goods-receipts/${id}/items/${itemId}/detail`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function getGoodsReceiptItemsCost(id: string): Promise<GoodsReceiptItemsCostData> {
  return axios
    .get<GoodsReceiptItemsCostData>(`commerce-api/goods-receipts/${id}/items/cost`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function getGoodsReceiptItemQuants(id: string, itemId: string): Promise<GoodsReceiptItemQuantsData> {
  return axios
    .get<GoodsReceiptItemQuantsData>(`commerce-api/goods-receipts/${id}/items/${itemId}/quants`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

export function addGoodsReceiptItemFromSupplierItem(
  id: string,
  data: AddGoodsReceiptItemFromSupplierItemPayload,
): Promise<GoodsReceiptItemData> {
  return axios
    .post<CreateResponse<GoodsReceiptItemData>>(`commerce-api/goods-receipts/${id}/items/from-supplier-item`, data)
    .then((r) => r.data.data);
}

export function addGoodsReceiptItemFromPurchaseOrderItem(
  id: string,
  data: AddGoodsReceiptItemFromPurchaseOrderItemPayload,
): Promise<GoodsReceiptItemData> {
  return axios
    .post<CreateResponse<GoodsReceiptItemData>>(
      `commerce-api/goods-receipts/${id}/items/from-purchase-order-item`,
      data,
    )
    .then((r) => r.data.data);
}

export function updateGoodsReceiptItem(
  id: string,
  itemId: string,
  data: UpdateGoodsReceiptItemPayload,
): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/goods-receipts/${id}/items/${itemId}`, data).then((r) => r.data);
}

export function removeGoodsReceiptItem(id: string, itemId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/goods-receipts/${id}/items/${itemId}`).then((r) => r.data);
}

// Lots (item-scoped)

export function getGoodsReceiptLots(id: string, itemId: string): Promise<GoodsReceiptLotData[]> {
  return axios
    .get<GoodsReceiptLotData[]>(`commerce-api/goods-receipts/${id}/items/${itemId}/lots`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function addGoodsReceiptLot(
  id: string,
  itemId: string,
  data: AddGoodsReceiptLotPayload,
): Promise<GoodsReceiptLotData> {
  return axios
    .post<CreateResponse<GoodsReceiptLotData>>(`commerce-api/goods-receipts/${id}/items/${itemId}/lots`, data)
    .then((r) => r.data.data);
}

export function updateGoodsReceiptLot(
  id: string,
  itemId: string,
  lotId: string,
  data: UpdateGoodsReceiptLotPayload,
): Promise<GoodsReceiptLotData> {
  return axios
    .patch<GoodsReceiptLotData>(`commerce-api/goods-receipts/${id}/items/${itemId}/lots/${lotId}`, data)
    .then((r) => r.data);
}

export function removeGoodsReceiptLot(id: string, itemId: string, lotId: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/goods-receipts/${id}/items/${itemId}/lots/${lotId}`)
    .then((r) => r.data);
}

// Lines (item-scoped)

export function getGoodsReceiptLinesTable(id: string, itemId: string): Promise<GoodsReceiptLinesTableResponse> {
  return axios
    .get<GoodsReceiptLinesTableResponse>(`commerce-api/goods-receipts/${id}/items/${itemId}/lines/table`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

export function getGoodsReceiptLinesByLotTable(
  id: string,
  itemId: string,
  lotId: string,
): Promise<GoodsReceiptLinesTableResponse> {
  return axios
    .get<GoodsReceiptLinesTableResponse>(
      `commerce-api/goods-receipts/${id}/items/${itemId}/lots/${lotId}/lines/table`,
      { showSuccessToast: false },
    )
    .then((r) => r.data);
}

export function getGoodsReceiptLineById(id: string, itemId: string, lineId: string): Promise<GoodsReceiptLineData> {
  return axios
    .get<GoodsReceiptLineData>(`commerce-api/goods-receipts/${id}/items/${itemId}/lines/${lineId}`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

export function addGoodsReceiptLine(
  id: string,
  itemId: string,
  data: AddGoodsReceiptLinePayload,
): Promise<GoodsReceiptLineData> {
  return axios
    .post<CreateResponse<GoodsReceiptLineData>>(`commerce-api/goods-receipts/${id}/items/${itemId}/lines`, data)
    .then((r) => r.data.data);
}

export function updateGoodsReceiptLine(
  id: string,
  itemId: string,
  lineId: string,
  data: UpdateGoodsReceiptLinePayload,
): Promise<GoodsReceiptLineData> {
  return axios
    .patch<GoodsReceiptLineData>(`commerce-api/goods-receipts/${id}/items/${itemId}/lines/${lineId}`, data)
    .then((r) => r.data);
}

export function removeGoodsReceiptLine(id: string, itemId: string, lineId: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/goods-receipts/${id}/items/${itemId}/lines/${lineId}`)
    .then((r) => r.data);
}

// Line items (serials, line-scoped)

export function getGoodsReceiptLineItemsTable(
  id: string,
  itemId: string,
  lineId: string,
): Promise<GoodsReceiptLineItemsTableResponse> {
  return axios
    .get<GoodsReceiptLineItemsTableResponse>(
      `commerce-api/goods-receipts/${id}/items/${itemId}/lines/${lineId}/items/table`,
      { showSuccessToast: false },
    )
    .then((r) => r.data);
}

export function addGoodsReceiptLineItem(
  id: string,
  itemId: string,
  lineId: string,
  data: AddGoodsReceiptLineItemPayload,
): Promise<GoodsReceiptLineItemData> {
  return axios
    .post<GoodsReceiptLineItemData>(`commerce-api/goods-receipts/${id}/items/${itemId}/lines/${lineId}/items`, data)
    .then((r) => r.data);
}

export function removeGoodsReceiptLineItem(
  id: string,
  itemId: string,
  lineId: string,
  subItemId: string,
): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/goods-receipts/${id}/items/${itemId}/lines/${lineId}/items/${subItemId}`)
    .then((r) => r.data);
}
