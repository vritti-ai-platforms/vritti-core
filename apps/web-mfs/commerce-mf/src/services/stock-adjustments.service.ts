import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type {
  StockAdjustmentData,
  StockAdjustmentLineData,
  StockAdjustmentLineItemData,
  StockAdjustmentLineItemsTableResponse,
  StockAdjustmentLinesTableResponse,
  StockAdjustmentLotData,
  StockAdjustmentLotDetailData,
  StockAdjustmentTreeNode,
  StockAdjustmentsTableResponse,
  StockAdjustmentType,
} from '@/schemas/stock-adjustments';

// Header
export interface CreateStockAdjustmentPayload {
  inventoryItemId: string;
  type: StockAdjustmentType;
  reason: string;
}

export interface UpdateStockAdjustmentPayload {
  reason?: string;
}

// Lots
export interface AddStockAdjustmentLotPayload {
  lotNumber: string;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
}

export interface UpdateStockAdjustmentLotPayload {
  lotNumber?: string;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
}

// Lines
export interface AddStockAdjustmentLinePayload {
  stockAdjustmentLotId?: string | null; // OPENING_STOCK + tracking=lot/item
  locationId?: string | null;            // OPENING_STOCK
  quantId?: string | null;               // deduct/CORRECTION
  quantity: number;
}

export interface UpdateStockAdjustmentLinePayload {
  stockAdjustmentLotId?: string | null;
  locationId?: string | null;
  quantId?: string | null;
  quantity?: number;
}

// Line items (serials)
export interface AddStockAdjustmentLineItemPayload {
  serialNumber: string;
}

export interface UpdateStockAdjustmentLineItemPayload {
  serialNumber: string;
}

// Reads

export function getStockAdjustmentsTable(): Promise<StockAdjustmentsTableResponse> {
  return axios.get<StockAdjustmentsTableResponse>('commerce-api/stock-adjustments/table').then((r) => r.data);
}

export function getStockAdjustment(id: string): Promise<StockAdjustmentData> {
  return axios.get<StockAdjustmentData>(`commerce-api/stock-adjustments/${id}`).then((r) => r.data);
}

export function getStockAdjustmentLots(id: string): Promise<StockAdjustmentLotData[]> {
  return axios.get<StockAdjustmentLotData[]>(`commerce-api/stock-adjustments/${id}/lots`).then((r) => r.data);
}

export function getStockAdjustmentLotDetail(
  id: string,
  lotId: string,
): Promise<StockAdjustmentLotDetailData> {
  return axios
    .get<StockAdjustmentLotDetailData>(`commerce-api/stock-adjustments/${id}/lots/${lotId}/detail`)
    .then((r) => r.data);
}

export function getStockAdjustmentTree(id: string): Promise<StockAdjustmentTreeNode[]> {
  return axios.get<StockAdjustmentTreeNode[]>(`commerce-api/stock-adjustments/${id}/tree`).then((r) => r.data);
}

export function getStockAdjustmentLines(id: string): Promise<StockAdjustmentLineData[]> {
  return axios.get<StockAdjustmentLineData[]>(`commerce-api/stock-adjustments/${id}/lines`).then((r) => r.data);
}

export function getStockAdjustmentLinesTable(id: string): Promise<StockAdjustmentLinesTableResponse> {
  return axios
    .get<StockAdjustmentLinesTableResponse>(`commerce-api/stock-adjustments/${id}/lines/table`)
    .then((r) => r.data);
}

export function getStockAdjustmentLinesByLot(id: string, lotId: string): Promise<StockAdjustmentLineData[]> {
  return axios
    .get<StockAdjustmentLineData[]>(`commerce-api/stock-adjustments/${id}/lots/${lotId}/lines`)
    .then((r) => r.data);
}

export function getStockAdjustmentLinesByLotTable(id: string, lotId: string): Promise<StockAdjustmentLinesTableResponse> {
  return axios
    .get<StockAdjustmentLinesTableResponse>(`commerce-api/stock-adjustments/${id}/lots/${lotId}/lines/table`)
    .then((r) => r.data);
}

export function getStockAdjustmentLine(id: string, lineId: string): Promise<StockAdjustmentLineData> {
  return axios
    .get<StockAdjustmentLineData>(`commerce-api/stock-adjustments/${id}/lines/${lineId}`)
    .then((r) => r.data);
}

export function getStockAdjustmentLineItemsTable(
  id: string,
  lineId: string,
): Promise<StockAdjustmentLineItemsTableResponse> {
  return axios
    .get<StockAdjustmentLineItemsTableResponse>(`commerce-api/stock-adjustments/${id}/lines/${lineId}/items/table`)
    .then((r) => r.data);
}

// Writes — header

export function createStockAdjustment(data: CreateStockAdjustmentPayload): Promise<StockAdjustmentData> {
  return axios
    .post<CreateResponse<StockAdjustmentData>>('commerce-api/stock-adjustments', data)
    .then((r) => r.data.data);
}

export function updateStockAdjustment(id: string, data: UpdateStockAdjustmentPayload): Promise<StockAdjustmentData> {
  return axios.patch<StockAdjustmentData>(`commerce-api/stock-adjustments/${id}`, data).then((r) => r.data);
}

export function publishStockAdjustment(id: string): Promise<StockAdjustmentData> {
  return axios.post<StockAdjustmentData>(`commerce-api/stock-adjustments/${id}/publish`).then((r) => r.data);
}

export function deleteStockAdjustment(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/stock-adjustments/${id}`).then((r) => r.data);
}

// Writes — lots

export function addStockAdjustmentLot(
  id: string,
  data: AddStockAdjustmentLotPayload,
): Promise<StockAdjustmentLotData> {
  return axios
    .post<CreateResponse<StockAdjustmentLotData>>(`commerce-api/stock-adjustments/${id}/lots`, data)
    .then((r) => r.data.data);
}

export function updateStockAdjustmentLot(
  id: string,
  lotId: string,
  data: UpdateStockAdjustmentLotPayload,
): Promise<StockAdjustmentLotData> {
  return axios
    .patch<StockAdjustmentLotData>(`commerce-api/stock-adjustments/${id}/lots/${lotId}`, data)
    .then((r) => r.data);
}

export function removeStockAdjustmentLot(id: string, lotId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/stock-adjustments/${id}/lots/${lotId}`).then((r) => r.data);
}

// Writes — lines

export function addStockAdjustmentLine(
  id: string,
  data: AddStockAdjustmentLinePayload,
): Promise<StockAdjustmentLineData> {
  return axios
    .post<CreateResponse<StockAdjustmentLineData>>(`commerce-api/stock-adjustments/${id}/lines`, data)
    .then((r) => r.data.data);
}

export function updateStockAdjustmentLine(
  id: string,
  lineId: string,
  data: UpdateStockAdjustmentLinePayload,
): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/stock-adjustments/${id}/lines/${lineId}`, data).then((r) => r.data);
}

export function removeStockAdjustmentLine(id: string, lineId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/stock-adjustments/${id}/lines/${lineId}`).then((r) => r.data);
}

// Writes — line items (serials)

export function addStockAdjustmentLineItem(
  id: string,
  lineId: string,
  data: AddStockAdjustmentLineItemPayload,
): Promise<StockAdjustmentLineItemData> {
  return axios
    .post<StockAdjustmentLineItemData>(`commerce-api/stock-adjustments/${id}/lines/${lineId}/items`, data)
    .then((r) => r.data);
}

export function updateStockAdjustmentLineItem(
  id: string,
  lineId: string,
  itemId: string,
  data: UpdateStockAdjustmentLineItemPayload,
): Promise<StockAdjustmentLineItemData> {
  return axios
    .patch<StockAdjustmentLineItemData>(`commerce-api/stock-adjustments/${id}/lines/${lineId}/items/${itemId}`, data)
    .then((r) => r.data);
}

export function removeStockAdjustmentLineItem(id: string, lineId: string, itemId: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/stock-adjustments/${id}/lines/${lineId}/items/${itemId}`)
    .then((r) => r.data);
}
