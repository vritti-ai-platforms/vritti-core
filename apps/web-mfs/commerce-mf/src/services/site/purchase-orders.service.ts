import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { GoodsReceiptsTableResponse } from '@/schemas/goods-receipts';
import type { InboundDeliveriesTableResponse } from '@/schemas/inbound-deliveries';
import type {
  AddPurchaseOrderItemPayload,
  ChangePurchaseOrderExchangeRatePayload,
  ChangePurchaseOrderSupplierPayload,
  CreatePurchaseOrderPayload,
  PurchaseOrderData,
  PurchaseOrderDetail,
  PurchaseOrderItemRef,
  PurchaseOrderItemsTableResponse,
  PurchaseOrderProblemsResponse,
  PurchaseOrdersTableResponse,
  SendPurchaseOrderEmailPayload,
  SetPurchaseOrderConversionRatePayload,
  UpdatePurchaseOrderItemPayload,
  UpdatePurchaseOrderNotesPayload,
  UpdatePurchaseOrderStatusPayload,
  UpdatePurchaseOrderTaxDatePayload,
} from '@/schemas/purchase-orders';

// Fetches the site's purchase orders for the data table
export function getPurchaseOrdersTable(): Promise<PurchaseOrdersTableResponse> {
  return axios.get<PurchaseOrdersTableResponse>('commerce-api/purchase-orders/table').then((r) => r.data);
}

// Creates a purchase order at the site
export function createPurchaseOrder(data: CreatePurchaseOrderPayload): Promise<CreateResponse<PurchaseOrderData>> {
  return axios.post<CreateResponse<PurchaseOrderData>>('commerce-api/purchase-orders', data).then((r) => r.data);
}

// Fetches one purchase order
export function getPurchaseOrder(id: string): Promise<PurchaseOrderDetail> {
  return axios.get<PurchaseOrderDetail>(`commerce-api/purchase-orders/${id}`).then((r) => r.data);
}

// Fetches the inventory items ordered on a purchase order
export function getPurchaseOrderItemIds(id: string): Promise<string[]> {
  return axios.get<string[]>(`commerce-api/purchase-orders/${id}/items/ids`).then((r) => r.data);
}

// Fetches a purchase order's lines for the data table
export function getPurchaseOrderItemsTable(id: string): Promise<PurchaseOrderItemsTableResponse> {
  return axios
    .get<PurchaseOrderItemsTableResponse>(`commerce-api/purchase-orders/${id}/items/table`)
    .then((r) => r.data);
}

// Fetches the inbound deliveries carrying a line of a purchase order for the data table
export function getPurchaseOrderInboundDeliveriesTable(id: string): Promise<InboundDeliveriesTableResponse> {
  return axios
    .get<InboundDeliveriesTableResponse>(`commerce-api/purchase-orders/${id}/inbound-deliveries/table`)
    .then((r) => r.data);
}

// Fetches the goods receipts counted against a purchase order for the data table
export function getPurchaseOrderGoodsReceiptsTable(id: string): Promise<GoodsReceiptsTableResponse> {
  return axios
    .get<GoodsReceiptsTableResponse>(`commerce-api/purchase-orders/${id}/goods-receipts/table`)
    .then((r) => r.data);
}

// Fetches what the system has flagged on a purchase order's receipts and invoices, by line and for the whole order
export function getPurchaseOrderProblems(id: string): Promise<PurchaseOrderProblemsResponse> {
  return axios.get<PurchaseOrderProblemsResponse>(`commerce-api/purchase-orders/${id}/problems`).then((r) => r.data);
}

// Downloads the purchase order as a PDF
export function downloadPurchaseOrderPdf(id: string): Promise<Blob> {
  return axios.get<Blob>(`commerce-api/purchase-orders/${id}/pdf`, { responseType: 'blob' }).then((r) => r.data);
}

// Adds a line to a purchase order
export function addPurchaseOrderItem({
  id,
  ...data
}: AddPurchaseOrderItemPayload): Promise<CreateResponse<PurchaseOrderData>> {
  return axios
    .post<CreateResponse<PurchaseOrderData>>(`commerce-api/purchase-orders/${id}/items`, data)
    .then((r) => r.data);
}

// Updates a line of a purchase order
export function updatePurchaseOrderItem({
  id,
  itemId,
  ...data
}: UpdatePurchaseOrderItemPayload): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/purchase-orders/${id}/items/${itemId}`, data).then((r) => r.data);
}

// Removes a line from a purchase order
export function removePurchaseOrderItem({ id, itemId }: PurchaseOrderItemRef): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/purchase-orders/${id}/items/${itemId}`).then((r) => r.data);
}

// Updates a purchase order's notes
export function updatePurchaseOrderNotes({ id, notes }: UpdatePurchaseOrderNotesPayload): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/purchase-orders/${id}/notes`, { notes: notes || null })
    .then((r) => r.data);
}

// Sets a purchase order's tax date; the lines that follow it move with it
export function updatePurchaseOrderTaxDate({
  id,
  taxDate,
}: UpdatePurchaseOrderTaxDatePayload): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/purchase-orders/${id}/tax-date`, { taxDate }).then((r) => r.data);
}

// Moves a draft purchase order to another supplier
export function changePurchaseOrderSupplier({
  id,
  ...data
}: ChangePurchaseOrderSupplierPayload): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/purchase-orders/${id}/supplier`, data).then((r) => r.data);
}

// Changes the rate of a purchase order in another currency than the legal entity's
export function changePurchaseOrderExchangeRate({
  id,
  exchangeRate,
}: ChangePurchaseOrderExchangeRatePayload): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/purchase-orders/${id}/exchange-rate`, { exchangeRate })
    .then((r) => r.data);
}

// Sets how much 1 unit of another of the supplier's currencies is in the PO currency; lines in it are converted again
export function setPurchaseOrderConversionRate({
  id,
  ...data
}: SetPurchaseOrderConversionRatePayload): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/purchase-orders/${id}/conversion-rates`, data).then((r) => r.data);
}

// Closes a purchase order short — no further receipts expected
export function closePurchaseOrder(id: string): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/purchase-orders/${id}/close`).then((r) => r.data);
}

// Moves a purchase order along its manual workflow
export function updatePurchaseOrderStatus({ id, status }: UpdatePurchaseOrderStatusPayload): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/purchase-orders/${id}/status`, { status }).then((r) => r.data);
}

// Emails the purchase order with its PDF to the supplier
export function sendPurchaseOrderEmail({ id, email }: SendPurchaseOrderEmailPayload): Promise<SuccessResponse> {
  return axios
    .post<SuccessResponse>(`commerce-api/purchase-orders/${id}/send-email`, { email: email || null })
    .then((r) => r.data);
}

// Deletes a draft purchase order
export function deletePurchaseOrder(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/purchase-orders/${id}`).then((r) => r.data);
}
