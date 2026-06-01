import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { GoodsReceiptsTableResponse } from '@/schemas/goods-receipts';
import type {
  ExchangeRateType,
  PurchaseOrderData,
  PurchaseOrderDetail,
  PurchaseOrderItemsTableResponse,
  PurchaseOrdersTableResponse,
} from '@/schemas/purchase-orders';

export interface CreatePurchaseOrderPayload {
  supplierId: string;
  exchangeRateType: ExchangeRateType;
  exchangeRate?: number | null;
  orderDate: string;
  expectedBy?: string;
  notes?: string;
}

export interface AddPurchaseOrderItemPayload {
  id: string;
  supplierItemId: string;
  uomQty: number;
  unitPrice: { currency: string; value: string };
  schemeBuyQty?: number;
  schemeFreeQty?: number;
  schemeMode?: 'none' | 'slab' | 'pro_rata';
}

export interface UpdatePurchaseOrderItemPayload {
  id: string;
  itemId: string;
  inventoryItemId?: string;
  uomQty?: number;
  unitPrice?: { currency: string; value: string };
  schemeBuyQty?: number;
  schemeFreeQty?: number;
  schemeMode?: 'none' | 'slab' | 'pro_rata';
}

export interface UpdatePurchaseOrderNotesPayload {
  id: string;
  notes?: string | null;
}

export interface ChangePurchaseOrderSupplierPayload {
  id: string;
  supplierId: string;
}

export interface ChangePurchaseOrderExchangeRatePayload {
  id: string;
  exchangeRateType: ExchangeRateType;
  exchangeRate?: number | null;
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
export function createPurchaseOrder(data: CreatePurchaseOrderPayload): Promise<CreateResponse<PurchaseOrderData>> {
  return axios.post<CreateResponse<PurchaseOrderData>>('commerce-api/purchase-orders', data).then((r) => r.data);
}

// Fetches purchase order header/detail
export function getPurchaseOrder(id: string): Promise<PurchaseOrderDetail> {
  return axios
    .get<PurchaseOrderDetail>(`commerce-api/purchase-orders/${id}`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches inventory item IDs for a purchase order
export function getPurchaseOrderItemIds(id: string): Promise<string[]> {
  return axios
    .get<string[]>(`commerce-api/purchase-orders/${id}/items/ids`, { showSuccessToast: false })
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

// Adds a line item to a purchase order
export function addPurchaseOrderItem({
  id,
  supplierItemId,
  uomQty,
  unitPrice,
  schemeBuyQty,
  schemeFreeQty,
  schemeMode,
}: AddPurchaseOrderItemPayload): Promise<CreateResponse<PurchaseOrderData>> {
  return axios
    .post<CreateResponse<PurchaseOrderData>>(`commerce-api/purchase-orders/${id}/items`, {
      supplierItemId,
      uomQty,
      unitPrice,
      schemeBuyQty,
      schemeFreeQty,
      schemeMode,
    })
    .then((r) => r.data);
}

// Updates a line item on a purchase order
export function updatePurchaseOrderItem({
  id,
  itemId,
  inventoryItemId,
  uomQty,
  unitPrice,
  schemeBuyQty,
  schemeFreeQty,
  schemeMode,
}: UpdatePurchaseOrderItemPayload): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/purchase-orders/${id}/items/${itemId}`, {
      inventoryItemId,
      uomQty,
      unitPrice,
      schemeBuyQty,
      schemeFreeQty,
      schemeMode,
    })
    .then((r) => r.data);
}

// Removes a line item from a purchase order
export function removePurchaseOrderItem({ id, itemId }: { id: string; itemId: string }): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/purchase-orders/${id}/items/${itemId}`).then((r) => r.data);
}

// Updates purchase order notes
export function updatePurchaseOrderNotes({ id, notes }: UpdatePurchaseOrderNotesPayload): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/purchase-orders/${id}/notes`, { notes: notes ?? null })
    .then((r) => r.data);
}

// Changes purchase order supplier
export function changePurchaseOrderSupplier({
  id,
  supplierId,
}: ChangePurchaseOrderSupplierPayload): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/purchase-orders/${id}/supplier`, { supplierId })
    .then((r) => r.data);
}

// Changes purchase order exchange rate policy and/or value
export function changePurchaseOrderExchangeRate({
  id,
  exchangeRateType,
  exchangeRate,
}: ChangePurchaseOrderExchangeRatePayload): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/purchase-orders/${id}/exchange-rate`, {
      exchangeRateType,
      exchangeRate,
    })
    .then((r) => r.data);
}

// Closes a purchase order short — no further receipts expected
export function closePurchaseOrder(id: string): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/purchase-orders/${id}/close`).then((r) => r.data);
}

// Updates a purchase order status
export function updatePurchaseOrderStatus({ id, status }: { id: string; status: string }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/purchase-orders/${id}/status`, { status }).then((r) => r.data);
}

// Deletes a purchase order
export function deletePurchaseOrder(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/purchase-orders/${id}`).then((r) => r.data);
}

// Fetches goods receipt table for a purchase order
export function getPurchaseOrderGoodsReceiptsTable(poId: string): Promise<GoodsReceiptsTableResponse> {
  return axios
    .get<GoodsReceiptsTableResponse>(`commerce-api/purchase-orders/${poId}/goods-receipts/table`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

// Fetches the unit price for an inventory item from a supplier's pricelist.
// Backend returns CurrencyAmountDto: { currency: string, value: string (major units) } | null.
export function getSupplierItemPrice(
  supplierId: string,
  inventoryItemId: string,
): Promise<{ unitPrice: { currency: string; value: string } | null }> {
  return axios
    .get<{ unitPrice: { currency: string; value: string } | null }>('commerce-api/suppliers/items/price', {
      params: { supplierId, inventoryItemId },
      showSuccessToast: false,
    } as Parameters<typeof axios.get>[1])
    .then((r) => r.data);
}

// Sends a purchase order email with PDF attachment
export function sendPurchaseOrderEmail({ id, email }: SendPurchaseOrderEmailPayload): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`commerce-api/purchase-orders/${id}/send-email`, { email }).then((r) => r.data);
}
