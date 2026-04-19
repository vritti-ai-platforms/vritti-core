import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { GoodsReceiptData, GoodsReceiptsTableResponse } from '@/schemas/goods-receipts';
import type {
  PurchaseOrderData,
  PurchaseOrderDetail,
  PurchaseOrderItemData,
  PurchaseOrderItemsTableResponse,
  PurchaseOrdersTableResponse,
} from '@/schemas/purchase-orders';

export interface CreatePurchaseOrderPayload {
  supplierId: string;
  orderDate: string;
  expectedBy?: string;
  notes?: string;
  items?: { inventoryItemId: string; orderedQuantity: number }[];
}

export interface UpdatePurchaseOrderPayload {
  expectedBy?: string | null;
  notes?: string | null;
  items?: { inventoryItemId: string; orderedQuantity: number; unitPrice?: number | null }[];
}

export interface CreateGoodsReceiptPayload {
  supplierId: string;
  purchaseOrderId?: string;
  receivedDate: string;
  receivedBy?: string;
  notes?: string;
}

export interface SendPurchaseOrderEmailPayload {
  id: string;
  email?: string;
}

// Fetches purchase orders for the data table
export function getPurchaseOrdersTable(): Promise<PurchaseOrdersTableResponse> {
  return axios
    .get<PurchaseOrdersTableResponse>('commerce-api/purchase-orders/table', { showSuccessToast: false })
    .then((r) => r.data);
}

// Creates a new purchase order
export function createPurchaseOrder(data: CreatePurchaseOrderPayload): Promise<PurchaseOrderData> {
  return axios.post<PurchaseOrderData>('commerce-api/purchase-orders', data).then((r) => r.data);
}

// Fetches purchase order header/detail
export function getPurchaseOrder(id: string): Promise<PurchaseOrderDetail> {
  return axios
    .get<PurchaseOrderDetail>(`commerce-api/purchase-orders/${id}`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches all line items for a purchase order
export function getPurchaseOrderItems(id: string): Promise<PurchaseOrderItemData[]> {
  return axios
    .get<PurchaseOrderItemData[]>(`commerce-api/purchase-orders/${id}/items`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches line items table data for a purchase order
export function getPurchaseOrderItemsTable(id: string): Promise<PurchaseOrderItemsTableResponse> {
  return axios
    .get<PurchaseOrderItemsTableResponse>(`commerce-api/purchase-orders/${id}/items/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Downloads the purchase order as a PDF blob for opening in the browser
export function downloadPurchaseOrderPdf(id: string): Promise<Blob> {
  return axios
    .get<Blob>(`commerce-api/purchase-orders/${id}/pdf`, {
      responseType: 'blob',
      showSuccessToast: false,
    } as Parameters<typeof axios.get>[1])
    .then((r) => r.data);
}

// Updates a purchase order
export function updatePurchaseOrder({
  id,
  data,
}: {
  id: string;
  data: UpdatePurchaseOrderPayload;
}): Promise<PurchaseOrderData> {
  return axios.patch<PurchaseOrderData>(`commerce-api/purchase-orders/${id}`, data).then((r) => r.data);
}

// Updates a purchase order status
export function updatePurchaseOrderStatus({ id, status }: { id: string; status: string }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/purchase-orders/${id}/status`, { status }).then((r) => r.data);
}

// Deletes a purchase order
export function deletePurchaseOrder(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/purchase-orders/${id}`).then((r) => r.data);
}

// Creates a goods receipt for a purchase order
export function createGoodsReceipt(data: CreateGoodsReceiptPayload): Promise<GoodsReceiptData> {
  return axios.post<GoodsReceiptData>('commerce-api/goods-receipts', data).then((r) => r.data);
}

// Fetches goods receipts for a purchase order
export function getGoodsReceipts(poId: string): Promise<GoodsReceiptData[]> {
  return axios
    .get<GoodsReceiptData[]>(`commerce-api/goods-receipts/by-po/${poId}`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches goods receipt table for a purchase order
export function getPurchaseOrderGoodsReceiptsTable(poId: string): Promise<GoodsReceiptsTableResponse> {
  return axios
    .get<GoodsReceiptsTableResponse>(`commerce-api/purchase-orders/${poId}/goods-reciept/table`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

// Fetches the unit price for an inventory item from a supplier's pricelist
export function getSupplierItemPrice(
  supplierId: string,
  inventoryItemId: string,
): Promise<{ unitPrice: number | null }> {
  return axios
    .get<{ unitPrice: number | null }>('commerce-api/suppliers/items/price', {
      params: { supplierId, inventoryItemId },
      showSuccessToast: false,
    } as Parameters<typeof axios.get>[1])
    .then((r) => r.data);
}

// Sends a purchase order email with PDF attachment
export function sendPurchaseOrderEmail({ id, email }: SendPurchaseOrderEmailPayload): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`commerce-api/purchase-orders/${id}/send-email`, { email }).then((r) => r.data);
}
