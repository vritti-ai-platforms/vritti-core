import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { GoodsReceiptData, PurchaseOrderData, PurchaseOrderDetail, PurchaseOrdersTableResponse } from '@/schemas/purchase-orders';

export interface CreatePurchaseOrderPayload {
  supplierId: string;
  orderDate: string;
  expectedDate?: string;
  notes?: string;
  items?: { inventoryItemId: string; orderedQuantity: number }[];
}

export interface UpdatePurchaseOrderPayload {
  expectedDate?: string | null;
  notes?: string | null;
  items?: { inventoryItemId: string; orderedQuantity: number }[];
}

export interface CreateGoodsReceiptPayload {
  purchaseOrderId: string;
  locationId: string;
  notes?: string;
  items: {
    purchaseOrderItemId: string;
    acceptedQuantity: number;
    rejectedQuantity: number;
    rejectionReason?: string;
  }[];
}

// Fetches purchase orders for the data table
export function getPurchaseOrdersTable(): Promise<PurchaseOrdersTableResponse> {
  return axios
    .get<PurchaseOrdersTableResponse>('commerce-api/purchase-orders/table', { showSuccessToast: false })
    .then((r) => r.data);
}

// Creates a new purchase order
export function createPurchaseOrder(data: CreatePurchaseOrderPayload): Promise<PurchaseOrderData> {
  return axios
    .post<PurchaseOrderData>('commerce-api/purchase-orders', data)
    .then((r) => r.data);
}

// Fetches purchase order detail with line items
export function getPurchaseOrder(id: string): Promise<PurchaseOrderDetail> {
  return axios
    .get<PurchaseOrderDetail>(`commerce-api/purchase-orders/${id}`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Updates a purchase order
export function updatePurchaseOrder({ id, data }: { id: string; data: UpdatePurchaseOrderPayload }): Promise<PurchaseOrderData> {
  return axios
    .patch<PurchaseOrderData>(`commerce-api/purchase-orders/${id}`, data)
    .then((r) => r.data);
}

// Updates a purchase order status
export function updatePurchaseOrderStatus({ id, status }: { id: string; status: string }): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/purchase-orders/${id}/status`, { status })
    .then((r) => r.data);
}

// Deletes a purchase order
export function deletePurchaseOrder(id: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/purchase-orders/${id}`)
    .then((r) => r.data);
}

// Creates a goods receipt for a purchase order
export function createGoodsReceipt(data: CreateGoodsReceiptPayload): Promise<GoodsReceiptData> {
  return axios
    .post<GoodsReceiptData>('commerce-api/goods-receipts', data)
    .then((r) => r.data);
}

// Fetches goods receipts for a purchase order
export function getGoodsReceipts(poId: string): Promise<GoodsReceiptData[]> {
  return axios
    .get<GoodsReceiptData[]>(`commerce-api/goods-receipts/by-po/${poId}`, { showSuccessToast: false })
    .then((r) => r.data);
}
