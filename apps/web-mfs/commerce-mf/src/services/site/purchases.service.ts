import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  AddPurchaseAllocationPayload,
  AddPurchaseAllocationsFromQuotationPayload,
  AddPurchaseItemPayload,
  CancelPurchaseLegPayload,
  CancelPurchasePayload,
  ChangePurchaseMinQuotationsPayload,
  ChangePurchaseNotesPayload,
  ClosePurchaseLegPayload,
  ClosePurchasePayload,
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
  DisablePurchaseQuotationsPayload,
  EnablePurchaseQuotationsPayload,
  PurchaseActions,
  PurchaseAllocation,
  PurchaseAllocationRef,
  PurchaseCounts,
  PurchaseData,
  PurchaseDetail,
  PurchaseItem,
  PurchaseItemAllocationsTableResponse,
  PurchaseItemComparisonTableResponse,
  PurchaseItemCounts,
  PurchaseItemDocumentsTableResponse,
  PurchaseItemFacets,
  PurchaseItemProgressSummary,
  PurchaseItemQuotesTableResponse,
  PurchaseItemRef,
  PurchaseItemSiteStock,
  PurchaseItemsTableResponse,
  PurchaseItemView,
  PurchaseLeg,
  PurchaseLegCount,
  PurchaseLegRef,
  PurchaseLegsTableResponse,
  PurchaseProgressSummary,
  PurchaseQuotationsTableResponse,
  PurchaseSettings,
  PurchaseSupplierDocuments,
  PurchasesTableResponse,
  RejectPurchaseLegPayload,
  RequestedPurchaseQuotation,
  RequestPurchaseQuotationPayload,
  UpdatePurchaseAllocationPayload,
  UpdatePurchaseItemPayload,
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

// Fetches a purchase's header: its counts, progress, where it stands, the actions it offers and why others are blocked
export function getPurchase(id: string): Promise<PurchaseDetail> {
  return axios.get<PurchaseDetail>(`${BASE}/${id}`).then((r) => r.data);
}

// Fetches how many item lines, suppliers and requested quotations a purchase has
export function getPurchaseCounts(id: string): Promise<PurchaseCounts> {
  return axios.get<PurchaseCounts>(`${BASE}/${id}/counts`).then((r) => r.data);
}

// Fetches how far a purchase's items have got and where it stands as a whole
export function getPurchaseProgress(id: string): Promise<PurchaseProgressSummary> {
  return axios.get<PurchaseProgressSummary>(`${BASE}/${id}/progress`).then((r) => r.data);
}

// Fetches the actions a purchase offers and why the others are blocked
export function getPurchaseActions(id: string): Promise<PurchaseActions> {
  return axios.get<PurchaseActions>(`${BASE}/${id}/actions`).then((r) => r.data);
}

// Fetches one page of a purchase's items with how far each has got
export function getPurchaseItemsTable(id: string): Promise<PurchaseItemsTableResponse> {
  return axios.get<PurchaseItemsTableResponse>(`${BASE}/${id}/items/table`).then((r) => r.data);
}

// Counts a purchase's items in each bucket of the items table
export function getPurchaseItemFacets(id: string): Promise<PurchaseItemFacets> {
  return axios.get<PurchaseItemFacets>(`${BASE}/${id}/items/facets`).then((r) => r.data);
}

// Fetches one purchase item as its own page shows it
export function getPurchaseItem(id: string, itemId: string): Promise<PurchaseItemView> {
  return axios.get<PurchaseItemView>(`${BASE}/${id}/items/${itemId}`).then((r) => r.data);
}

// Fetches the counts a purchase item's page labels its tabs with
export function getPurchaseItemCounts(id: string, itemId: string): Promise<PurchaseItemCounts> {
  return axios.get<PurchaseItemCounts>(`${BASE}/${id}/items/${itemId}/counts`).then((r) => r.data);
}

// Fetches how far a purchase item has got, in all and per supplier
export function getPurchaseItemProgress(id: string, itemId: string): Promise<PurchaseItemProgressSummary> {
  return axios.get<PurchaseItemProgressSummary>(`${BASE}/${id}/items/${itemId}/progress`).then((r) => r.data);
}

// Fetches one page of a purchase item's allocations
export function getPurchaseItemAllocationsTable(
  id: string,
  itemId: string,
): Promise<PurchaseItemAllocationsTableResponse> {
  return axios
    .get<PurchaseItemAllocationsTableResponse>(`${BASE}/${id}/items/${itemId}/allocations/table`)
    .then((r) => r.data);
}

// Fetches one page of the quotation lines quoting a purchase item
export function getPurchaseItemQuotesTable(id: string, itemId: string): Promise<PurchaseItemQuotesTableResponse> {
  return axios.get<PurchaseItemQuotesTableResponse>(`${BASE}/${id}/items/${itemId}/quotes/table`).then((r) => r.data);
}

// Fetches one page of the document lines that move a purchase item
export function getPurchaseItemDocumentsTable(id: string, itemId: string): Promise<PurchaseItemDocumentsTableResponse> {
  return axios
    .get<PurchaseItemDocumentsTableResponse>(`${BASE}/${id}/items/${itemId}/documents/table`)
    .then((r) => r.data);
}

// Fetches a purchase item's stock at the purchase's site, null while the site does not carry it
export function getPurchaseItemSiteStock(id: string, itemId: string): Promise<PurchaseItemSiteStock | null> {
  return axios.get<PurchaseItemSiteStock | null>(`${BASE}/${id}/items/${itemId}/site-stock`).then((r) => r.data);
}

// Fetches one page of a purchase's items with the quotation lines that quote each
export function getPurchaseItemComparison(id: string): Promise<PurchaseItemComparisonTableResponse> {
  return axios.get<PurchaseItemComparisonTableResponse>(`${BASE}/${id}/items/comparison`).then((r) => r.data);
}

// Fetches one page of the quotations linked to a purchase, without their lines
export function getPurchaseQuotationsTable(id: string): Promise<PurchaseQuotationsTableResponse> {
  return axios.get<PurchaseQuotationsTableResponse>(`${BASE}/${id}/quotations/table`).then((r) => r.data);
}

// Fetches one page of a purchase's suppliers with their documents, progress, actions and blockers
export function getPurchaseSuppliersTable(id: string): Promise<PurchaseLegsTableResponse> {
  return axios.get<PurchaseLegsTableResponse>(`${BASE}/${id}/suppliers/table`).then((r) => r.data);
}

// Fetches one supplier of a purchase with its allocations, documents, progress, actions and blockers
export function getPurchaseSupplier(id: string, legId: string): Promise<PurchaseLeg> {
  return axios.get<PurchaseLeg>(`${BASE}/${id}/suppliers/${legId}`).then((r) => r.data);
}

// Counts a purchase's suppliers and their lines by step and status
export function getPurchaseSupplierCounts(id: string): Promise<PurchaseLegCount[]> {
  return axios.get<PurchaseLegCount[]>(`${BASE}/${id}/suppliers/counts`).then((r) => r.data);
}

// Fetches the documents of every supplier of a purchase
export function getPurchaseDocuments(id: string): Promise<PurchaseSupplierDocuments[]> {
  return axios.get<PurchaseSupplierDocuments[]>(`${BASE}/${id}/documents`).then((r) => r.data);
}

// Changes an open purchase's notes
export function changePurchaseNotes({ id, ...data }: ChangePurchaseNotesPayload): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}/notes`, data).then((r) => r.data);
}

// Requires quotations on a purchase none of whose suppliers is submitted yet
export function enablePurchaseQuotations({ id, ...data }: EnablePurchaseQuotationsPayload): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/quotations/enable`, data).then((r) => r.data);
}

// Stops requiring quotations on an open purchase, recording why
export function disablePurchaseQuotations({ id, ...data }: DisablePurchaseQuotationsPayload): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/quotations/disable`, data).then((r) => r.data);
}

// Changes how many posted quotations each item needs before its supplier is submitted
export function changePurchaseMinQuotations({
  id,
  ...data
}: ChangePurchaseMinQuotationsPayload): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}/quotations/minimum`, data).then((r) => r.data);
}

// Cancels a purchase, recording why
export function cancelPurchase({ id, reason }: CancelPurchasePayload): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/cancel`, { reason }).then((r) => r.data);
}

// Closes a purchase: suppliers with goods received stop expecting more, the others are cancelled
export function closePurchase({ id, ...data }: ClosePurchasePayload): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/close`, data).then((r) => r.data);
}

// Deletes a purchase no supplier is added to, with its items
export function deletePurchase(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${id}`).then((r) => r.data);
}

// Adds an item the purchase does not have yet to its items
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

// Opens a draft quotation for a supplier with one line per purchase item still to allocate
export function requestPurchaseQuotation({
  id,
  supplierId,
}: RequestPurchaseQuotationPayload): Promise<CreateResponse<RequestedPurchaseQuotation>> {
  return axios
    .post<CreateResponse<RequestedPurchaseQuotation>>(`${BASE}/${id}/quotations`, { supplierId })
    .then((r) => r.data);
}

// Allocates part of an item to a supplier, opening the supplier's leg on its first allocation
export function addPurchaseAllocation({
  id,
  ...data
}: AddPurchaseAllocationPayload): Promise<CreateResponse<PurchaseAllocation>> {
  return axios.post<CreateResponse<PurchaseAllocation>>(`${BASE}/${id}/allocations`, data).then((r) => r.data);
}

// Allocates what is still to allocate of items from posted quotation lines, or from every line of a quotation
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

// Submits every supplier still in sourcing
export function submitPurchase(id: string): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/submit`).then((r) => r.data);
}

// Submits one supplier in sourcing on its own
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

// Closes a supplier for receiving: its open purchase orders complete, and it closes once invoiced
export function closePurchaseLeg({ id, legId, ...data }: ClosePurchaseLegPayload): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/legs/${legId}/close`, data).then((r) => r.data);
}

// Cancels a supplier nothing is received or invoiced on, returning its quantity to allocate or dropping it
export function cancelPurchaseLeg({ id, legId, ...data }: CancelPurchaseLegPayload): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/legs/${legId}/cancel`, data).then((r) => r.data);
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

// Fetches the purchasing rules the legal entity set for the session site
export function getPurchaseSettings(): Promise<PurchaseSettings> {
  return axios.get<PurchaseSettings>(`${BASE}/settings`).then((r) => r.data);
}
