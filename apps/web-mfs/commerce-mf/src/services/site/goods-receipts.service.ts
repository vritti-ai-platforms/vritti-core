import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  AddGoodsReceiptLineItemPayload,
  AddGoodsReceiptLinePayload,
  AddGoodsReceiptLotPayload,
  AddGoodsReceiptPurchaseOrderPayload,
  CreateGoodsReceiptFromDeliveryPayload,
  CreateGoodsReceiptFromPurchaseOrdersPayload,
  GoodsReceiptData,
  GoodsReceiptItemData,
  GoodsReceiptItemQuantsData,
  GoodsReceiptItemsCostData,
  GoodsReceiptLineData,
  GoodsReceiptLineItemData,
  GoodsReceiptLineItemsTableResponse,
  GoodsReceiptLinesTableResponse,
  GoodsReceiptLotData,
  GoodsReceiptsTableResponse,
  GoodsReceiptTreeNode,
  UpdateGoodsReceiptItemPayload,
  UpdateGoodsReceiptLinePayload,
  UpdateGoodsReceiptLotPayload,
  UpdateGoodsReceiptPayload,
} from '@/schemas/goods-receipts';

// Fetches the site's goods receipts for the data table
export function getGoodsReceiptsTable(): Promise<GoodsReceiptsTableResponse> {
  return axios.get<GoodsReceiptsTableResponse>('commerce-api/goods-receipts/table').then((r) => r.data);
}

// Fetches one goods receipt
export function getGoodsReceipt(id: string): Promise<GoodsReceiptData> {
  return axios.get<GoodsReceiptData>(`commerce-api/goods-receipts/${id}`).then((r) => r.data);
}

// Fetches a goods receipt's items with their lots and lines as a tree
export function getGoodsReceiptTree(id: string): Promise<GoodsReceiptTreeNode[]> {
  return axios.get<GoodsReceiptTreeNode[]>(`commerce-api/goods-receipts/${id}/tree`).then((r) => r.data);
}

// Starts a draft goods receipt of an announced inbound delivery, pre-filled with its open lines
export function createGoodsReceiptFromDelivery(
  data: CreateGoodsReceiptFromDeliveryPayload,
): Promise<CreateResponse<GoodsReceiptData>> {
  return axios
    .post<CreateResponse<GoodsReceiptData>>('commerce-api/goods-receipts/from-delivery', data)
    .then((r) => r.data);
}

// Starts a draft goods receipt of a supplier's purchase orders that arrived without an announced delivery
export function createGoodsReceiptFromPurchaseOrders(
  data: CreateGoodsReceiptFromPurchaseOrdersPayload,
): Promise<CreateResponse<GoodsReceiptData>> {
  return axios
    .post<CreateResponse<GoodsReceiptData>>('commerce-api/goods-receipts/from-purchase-orders', data)
    .then((r) => r.data);
}

// Adds every open line of another purchase order of the supplier to a draft goods receipt
export function addGoodsReceiptPurchaseOrder(
  id: string,
  data: AddGoodsReceiptPurchaseOrderPayload,
): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`commerce-api/goods-receipts/${id}/purchase-orders`, data).then((r) => r.data);
}

// Changes a draft receipt's notes and the supplier's delivery note on the inbound delivery it created
export function updateGoodsReceipt(id: string, data: UpdateGoodsReceiptPayload): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/goods-receipts/${id}`, data).then((r) => r.data);
}

// Publishes a goods receipt: its stock lands at the site and its purchase order lines' received quantities move
export function publishGoodsReceipt(id: string): Promise<GoodsReceiptData> {
  return axios.post<GoodsReceiptData>(`commerce-api/goods-receipts/${id}/publish`).then((r) => r.data);
}

// Deletes a draft goods receipt
export function deleteGoodsReceipt(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/goods-receipts/${id}`).then((r) => r.data);
}

// Fetches the provisional cost of a goods receipt's accepted items
export function getGoodsReceiptItemsCost(id: string): Promise<GoodsReceiptItemsCostData> {
  return axios.get<GoodsReceiptItemsCostData>(`commerce-api/goods-receipts/${id}/items/cost`).then((r) => r.data);
}

// Fetches the stock batches a published goods receipt item created
export function getGoodsReceiptItemQuants(id: string, itemId: string): Promise<GoodsReceiptItemQuantsData> {
  return axios
    .get<GoodsReceiptItemQuantsData>(`commerce-api/goods-receipts/${id}/items/${itemId}/quants`)
    .then((r) => r.data);
}

// Fetches one goods receipt item with its purchase order counts and flags
export function getGoodsReceiptItem(id: string, itemId: string): Promise<GoodsReceiptItemData> {
  return axios
    .get<GoodsReceiptItemData>(`commerce-api/goods-receipts/${id}/items/${itemId}/detail`)
    .then((r) => r.data);
}

// Updates an item's received and rejected quantities
export function updateGoodsReceiptItem(
  id: string,
  itemId: string,
  data: UpdateGoodsReceiptItemPayload,
): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/goods-receipts/${id}/items/${itemId}`, data).then((r) => r.data);
}

// Removes an item with its lots, lines and serials
export function removeGoodsReceiptItem(id: string, itemId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/goods-receipts/${id}/items/${itemId}`).then((r) => r.data);
}

// Fetches the lots of a goods receipt item
export function getGoodsReceiptLots(id: string, itemId: string): Promise<GoodsReceiptLotData[]> {
  return axios.get<GoodsReceiptLotData[]>(`commerce-api/goods-receipts/${id}/items/${itemId}/lots`).then((r) => r.data);
}

// Adds a lot to a goods receipt item
export function addGoodsReceiptLot(
  id: string,
  itemId: string,
  data: AddGoodsReceiptLotPayload,
): Promise<CreateResponse<GoodsReceiptLotData>> {
  return axios
    .post<CreateResponse<GoodsReceiptLotData>>(`commerce-api/goods-receipts/${id}/items/${itemId}/lots`, data)
    .then((r) => r.data);
}

// Updates a lot's number, dates or MRP
export function updateGoodsReceiptLot(
  id: string,
  itemId: string,
  lotId: string,
  data: UpdateGoodsReceiptLotPayload,
): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/goods-receipts/${id}/items/${itemId}/lots/${lotId}`, data)
    .then((r) => r.data);
}

// Removes a lot with its lines and serials
export function removeGoodsReceiptLot(id: string, itemId: string, lotId: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/goods-receipts/${id}/items/${itemId}/lots/${lotId}`)
    .then((r) => r.data);
}

// Fetches an item's lines for the data table
export function getGoodsReceiptLinesTable(id: string, itemId: string): Promise<GoodsReceiptLinesTableResponse> {
  return axios
    .get<GoodsReceiptLinesTableResponse>(`commerce-api/goods-receipts/${id}/items/${itemId}/lines/table`)
    .then((r) => r.data);
}

// Fetches a lot's lines for the data table
export function getGoodsReceiptLinesByLotTable(
  id: string,
  itemId: string,
  lotId: string,
): Promise<GoodsReceiptLinesTableResponse> {
  return axios
    .get<GoodsReceiptLinesTableResponse>(`commerce-api/goods-receipts/${id}/items/${itemId}/lots/${lotId}/lines/table`)
    .then((r) => r.data);
}

// Fetches one line of a goods receipt item
export function getGoodsReceiptLine(id: string, itemId: string, lineId: string): Promise<GoodsReceiptLineData> {
  return axios
    .get<GoodsReceiptLineData>(`commerce-api/goods-receipts/${id}/items/${itemId}/lines/${lineId}`)
    .then((r) => r.data);
}

// Distributes part of an item's accepted quantity to a storage location
export function addGoodsReceiptLine(
  id: string,
  itemId: string,
  data: AddGoodsReceiptLinePayload,
): Promise<CreateResponse<GoodsReceiptLineData>> {
  return axios
    .post<CreateResponse<GoodsReceiptLineData>>(`commerce-api/goods-receipts/${id}/items/${itemId}/lines`, data)
    .then((r) => r.data);
}

// Updates a line's location or quantity
export function updateGoodsReceiptLine(
  id: string,
  itemId: string,
  lineId: string,
  data: UpdateGoodsReceiptLinePayload,
): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/goods-receipts/${id}/items/${itemId}/lines/${lineId}`, data)
    .then((r) => r.data);
}

// Removes a line with its serials
export function removeGoodsReceiptLine(id: string, itemId: string, lineId: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/goods-receipts/${id}/items/${itemId}/lines/${lineId}`)
    .then((r) => r.data);
}

// Fetches a line's serials for the data table
export function getGoodsReceiptLineItemsTable(
  id: string,
  itemId: string,
  lineId: string,
): Promise<GoodsReceiptLineItemsTableResponse> {
  return axios
    .get<GoodsReceiptLineItemsTableResponse>(
      `commerce-api/goods-receipts/${id}/items/${itemId}/lines/${lineId}/items/table`,
    )
    .then((r) => r.data);
}

// Adds a serial to a line
export function addGoodsReceiptLineItem(
  id: string,
  itemId: string,
  lineId: string,
  data: AddGoodsReceiptLineItemPayload,
): Promise<CreateResponse<GoodsReceiptLineItemData>> {
  return axios
    .post<CreateResponse<GoodsReceiptLineItemData>>(
      `commerce-api/goods-receipts/${id}/items/${itemId}/lines/${lineId}/items`,
      data,
    )
    .then((r) => r.data);
}

// Removes a serial from a line
export function removeGoodsReceiptLineItem(
  id: string,
  itemId: string,
  lineId: string,
  serialId: string,
): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/goods-receipts/${id}/items/${itemId}/lines/${lineId}/items/${serialId}`)
    .then((r) => r.data);
}
