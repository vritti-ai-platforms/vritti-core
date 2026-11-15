import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  AddPurchaseAllocationPayload,
  AddPurchaseAllocationsFromQuotationPayload,
  AddPurchaseItemPayload,
  CancelPurchasePayload,
  ClosePurchaseLegPayload,
  ConfirmPurchaseLegPurchaseOrderPayload,
  CreatedPurchaseLegGoodsReceipt,
  CreatedPurchaseLegInboundDelivery,
  CreatedPurchaseLegPurchaseOrders,
  CreatedPurchaseSupplierInvoice,
  CreatePurchaseLegGoodsReceiptPayload,
  CreatePurchaseLegInboundDeliveryPayload,
  CreatePurchaseLegPurchaseOrdersPayload,
  CreatePurchasePayload,
  CreatePurchaseSupplierInvoicePayload,
  PurchaseAllocation,
  PurchaseAllocationRef,
  PurchaseData,
  PurchaseHeader,
  PurchaseItem,
  PurchaseItemRef,
  PurchaseLeg,
  PurchaseLegRef,
  PurchaseQuotation,
  PurchaseSourcingItem,
  PurchasesTableResponse,
  RejectPurchaseLegPayload,
  RequestedPurchaseQuotation,
  RequestPurchaseQuotationPayload,
  UpdatePurchaseAllocationPayload,
  UpdatePurchaseItemPayload,
  UpdatePurchasePayload,
} from '@/schemas/purchases';
import type {
  CreatedReceiveWithInvoice,
  ReceiveWithInvoiceDetail,
  ReceiveWithInvoiceOpenLine,
  ReceiveWithInvoiceOpenLinesParams,
  ReceiveWithInvoicePayload,
  UpdateReceiveWithInvoiceVars,
} from '@/schemas/receive-with-invoices';

const BASE = 'commerce-api/site/purchases';

// Fetches the site's purchases for the data table
export function getPurchasesTable(): Promise<PurchasesTableResponse> {
  return axios.get<PurchasesTableResponse>(`${BASE}/table`).then((r) => r.data);
}

// Creates a purchase at the site
export function createPurchase(data: CreatePurchasePayload): Promise<CreateResponse<PurchaseData>> {
  return axios.post<CreateResponse<PurchaseData>>(BASE, data).then((r) => r.data);
}

// Fetches a purchase's header: its stage, counts, progress and the purchase-level actions it offers
export function getPurchase(id: string): Promise<PurchaseHeader> {
  return axios.get<PurchaseHeader>(`${BASE}/${id}`).then((r) => r.data);
}

// Fetches a purchase's requested items
export function getPurchaseItems(id: string): Promise<PurchaseItem[]> {
  return axios.get<PurchaseItem[]>(`${BASE}/${id}/items`).then((r) => r.data);
}

// Fetches the quotations linked to a purchase
export function getPurchaseQuotations(id: string): Promise<PurchaseQuotation[]> {
  return axios.get<PurchaseQuotation[]>(`${BASE}/${id}/quotations`).then((r) => r.data);
}

// Fetches a purchase's items with the allocations sourcing each of them
export function getPurchaseSourcingItems(id: string): Promise<PurchaseSourcingItem[]> {
  return axios.get<PurchaseSourcingItem[]>(`${BASE}/${id}/sourcing/items`).then((r) => r.data);
}

// Fetches the suppliers a purchase sources from, each with its allocations, documents, progress and actions
export function getPurchaseSuppliers(id: string): Promise<PurchaseLeg[]> {
  return axios.get<PurchaseLeg[]>(`${BASE}/${id}/suppliers`).then((r) => r.data);
}

// Updates a purchase's details while it is in the Items step
export function updatePurchase({ id, ...data }: UpdatePurchasePayload): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}`, data).then((r) => r.data);
}

// Cancels a purchase, recording why
export function cancelPurchase({ id, reason }: CancelPurchasePayload): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/cancel`, { reason }).then((r) => r.data);
}

// Deletes a purchase nothing exists behind yet, with its items
export function deletePurchase(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${id}`).then((r) => r.data);
}

// Adds an item to a purchase's items; an item already there gets the quantity added
export function addPurchaseItem({ id, ...data }: AddPurchaseItemPayload): Promise<CreateResponse<PurchaseItem>> {
  return axios.post<CreateResponse<PurchaseItem>>(`${BASE}/${id}/items`, data).then((r) => r.data);
}

// Updates an item of a purchase's items
export function updatePurchaseItem({ id, itemId, ...data }: UpdatePurchaseItemPayload): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}/items/${itemId}`, data).then((r) => r.data);
}

// Removes an item from a purchase's items
export function removePurchaseItem({ id, itemId }: PurchaseItemRef): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${id}/items/${itemId}`).then((r) => r.data);
}

// Submits a purchase's items, moving it to quotations or sourcing
export function submitPurchaseItems(id: string): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/submit-items`).then((r) => r.data);
}

// Opens a draft quotation for a supplier with one line per purchase item
export function requestPurchaseQuotation({
  id,
  supplierId,
}: RequestPurchaseQuotationPayload): Promise<CreateResponse<RequestedPurchaseQuotation>> {
  return axios
    .post<CreateResponse<RequestedPurchaseQuotation>>(`${BASE}/${id}/quotations`, { supplierId })
    .then((r) => r.data);
}

// Completes a purchase's quotations, moving it to sourcing
export function completePurchaseQuotations(id: string): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/complete-quotations`).then((r) => r.data);
}

// Allocates part of an item to a supplier, opening the supplier's leg on its first allocation
export function addPurchaseAllocation({
  id,
  ...data
}: AddPurchaseAllocationPayload): Promise<CreateResponse<PurchaseAllocation>> {
  return axios.post<CreateResponse<PurchaseAllocation>>(`${BASE}/${id}/allocations`, data).then((r) => r.data);
}

// Allocates items from posted quotation lines at their quoted unit and price
export function addPurchaseAllocationsFromQuotation({
  id,
  ...data
}: AddPurchaseAllocationsFromQuotationPayload): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/allocations/from-quotation`, data).then((r) => r.data);
}

// Updates an allocation while its supplier's leg is in sourcing
export function updatePurchaseAllocation({
  id,
  allocationId,
  ...data
}: UpdatePurchaseAllocationPayload): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}/allocations/${allocationId}`, data).then((r) => r.data);
}

// Removes an allocation, closing its supplier's leg with its last allocation
export function removePurchaseAllocation({ id, allocationId }: PurchaseAllocationRef): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${id}/allocations/${allocationId}`).then((r) => r.data);
}

// Submits a purchase's sourcing, starting every supplier leg still in sourcing
export function submitPurchase(id: string): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/submit`).then((r) => r.data);
}

// Resubmits one supplier leg on its own
export function submitPurchaseLeg({ id, legId }: PurchaseLegRef): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/legs/${legId}/submit`).then((r) => r.data);
}

// Approves a supplier leg awaiting approval
export function approvePurchaseLeg({ id, legId }: PurchaseLegRef): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/legs/${legId}/approve`).then((r) => r.data);
}

// Rejects a supplier leg back to sourcing, recording why
export function rejectPurchaseLeg({ id, legId, reason }: RejectPurchaseLegPayload): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/legs/${legId}/reject`, { reason }).then((r) => r.data);
}

// Raises the leg's purchase orders from its allocations, one per currency, sent to the supplier
export function createPurchaseLegPurchaseOrders({
  id,
  legId,
  ...data
}: CreatePurchaseLegPurchaseOrdersPayload): Promise<CreateResponse<CreatedPurchaseLegPurchaseOrders>> {
  return axios
    .post<CreateResponse<CreatedPurchaseLegPurchaseOrders>>(`${BASE}/${id}/legs/${legId}/purchase-orders`, data)
    .then((r) => r.data);
}

// Confirms one of the leg's sent purchase orders
export function confirmPurchaseLegPurchaseOrder({
  id,
  legId,
  purchaseOrderId,
}: ConfirmPurchaseLegPurchaseOrderPayload): Promise<SuccessResponse> {
  return axios
    .post<SuccessResponse>(`${BASE}/${id}/legs/${legId}/purchase-orders/${purchaseOrderId}/confirm`)
    .then((r) => r.data);
}

// Creates an inbound delivery of the leg's confirmed purchase order lines
export function createPurchaseLegInboundDelivery({
  id,
  legId,
  ...data
}: CreatePurchaseLegInboundDeliveryPayload): Promise<CreateResponse<CreatedPurchaseLegInboundDelivery>> {
  return axios
    .post<CreateResponse<CreatedPurchaseLegInboundDelivery>>(`${BASE}/${id}/legs/${legId}/inbound-deliveries`, data)
    .then((r) => r.data);
}

// Starts a draft goods receipt of the leg, from one of its deliveries or its open confirmed lines
export function createPurchaseLegGoodsReceipt({
  id,
  legId,
  ...data
}: CreatePurchaseLegGoodsReceiptPayload): Promise<CreateResponse<CreatedPurchaseLegGoodsReceipt>> {
  return axios
    .post<CreateResponse<CreatedPurchaseLegGoodsReceipt>>(`${BASE}/${id}/legs/${legId}/goods-receipts`, data)
    .then((r) => r.data);
}

// Closes the leg, closing its open purchase order lines short
export function closePurchaseLeg({ id, legId, ...data }: ClosePurchaseLegPayload): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/legs/${legId}/close`, data).then((r) => r.data);
}

// Drafts a supplier invoice invoicing the supplier's posted receipts of its open legs
export function createPurchaseSupplierInvoice(
  data: CreatePurchaseSupplierInvoicePayload,
): Promise<CreateResponse<CreatedPurchaseSupplierInvoice>> {
  return axios
    .post<CreateResponse<CreatedPurchaseSupplierInvoice>>(`${BASE}/supplier-invoices`, data)
    .then((r) => r.data);
}

// Fetches the supplier's allocations still open to a Receive with Invoice, a draft's own lines counting as open
export function getReceiveWithInvoiceOpenLines({
  supplierId,
  excludeInvoiceId,
}: ReceiveWithInvoiceOpenLinesParams): Promise<ReceiveWithInvoiceOpenLine[]> {
  return axios
    .get<ReceiveWithInvoiceOpenLine[]>(`${BASE}/receive-with-invoices/open-lines`, {
      params: { supplierId, excludeInvoiceId },
    })
    .then((r) => r.data);
}

// Drafts a Receive with Invoice: the receipts of its lines and the supplier invoice covering them
export function createReceiveWithInvoice(
  data: ReceiveWithInvoicePayload,
): Promise<CreateResponse<CreatedReceiveWithInvoice>> {
  return axios
    .post<CreateResponse<CreatedReceiveWithInvoice>>(`${BASE}/receive-with-invoices`, data)
    .then((r) => r.data);
}

// Fetches a Receive with Invoice by its supplier invoice
export function getReceiveWithInvoice(invoiceId: string): Promise<ReceiveWithInvoiceDetail> {
  return axios.get<ReceiveWithInvoiceDetail>(`${BASE}/receive-with-invoices/${invoiceId}`).then((r) => r.data);
}

// Replaces a draft Receive with Invoice with the invoice as entered now
export function updateReceiveWithInvoice({ invoiceId, data }: UpdateReceiveWithInvoiceVars): Promise<SuccessResponse> {
  return axios.put<SuccessResponse>(`${BASE}/receive-with-invoices/${invoiceId}`, data).then((r) => r.data);
}

// Posts a draft Receive with Invoice: its receipts land in stock and its invoice settles their cost
export function postReceiveWithInvoice(invoiceId: string): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/receive-with-invoices/${invoiceId}/post`).then((r) => r.data);
}

// Discards a draft Receive with Invoice with the receipts and deliveries it created
export function discardReceiveWithInvoice(invoiceId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/receive-with-invoices/${invoiceId}`).then((r) => r.data);
}
