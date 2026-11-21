import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  AddSupplierInvoiceLineVars,
  CreateSupplierInvoicePayload,
  InvoiceableGoodsReceipt,
  InvoiceableGoodsReceiptsParams,
  ReleaseSupplierInvoiceHoldVars,
  RemoveSupplierInvoiceLineVars,
  SupplierInvoice,
  SupplierInvoiceCounts,
  SupplierInvoiceDetail,
  SupplierInvoiceRef,
  SupplierInvoicesTableResponse,
  UpdateSupplierInvoiceLineVars,
  UpdateSupplierInvoiceVars,
} from '@/schemas/supplier-invoices';

const BASE = 'commerce-api/le/supplier-invoices';

// Fetches the invoices of the legal entity's sites for the data table, narrowed by the table's saved context
export function getSupplierInvoicesTable(): Promise<SupplierInvoicesTableResponse> {
  return axios.get<SupplierInvoicesTableResponse>(`${BASE}/table`).then((r) => r.data);
}

// Fetches an invoice with its lines and holds
export function getSupplierInvoice(invoiceId: string): Promise<SupplierInvoiceDetail> {
  return axios.get<SupplierInvoiceDetail>(`${BASE}/${invoiceId}`).then((r) => r.data);
}

// Fetches how many lines and holds an invoice has, one per tab
export function getSupplierInvoiceCounts(invoiceId: string): Promise<SupplierInvoiceCounts> {
  return axios.get<SupplierInvoiceCounts>(`${BASE}/${invoiceId}/counts`).then((r) => r.data);
}

// Fetches a supplier's posted receipt batches at one of the legal entity's sites with quantity left to invoice
export function getInvoiceableGoodsReceipts(
  supplierId: string,
  siteId: string,
  params: InvoiceableGoodsReceiptsParams,
): Promise<InvoiceableGoodsReceipt[]> {
  return axios
    .get<InvoiceableGoodsReceipt[]>(`${BASE}/invoiceable-goods-receipts/sites/${siteId}`, {
      params: { supplierId, ...params },
    })
    .then((r) => r.data);
}

// Records a draft invoice from a supplier at one of the legal entity's sites
export function createSupplierInvoice(data: CreateSupplierInvoicePayload): Promise<SupplierInvoice> {
  return axios.post<CreateResponse<SupplierInvoice>>(BASE, data).then((r) => r.data.data);
}

// Updates an invoice's header
export function updateSupplierInvoice({ invoice, data }: UpdateSupplierInvoiceVars): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${invoice.id}`, data).then((r) => r.data);
}

// Posts a draft invoice, setting the final cost of the stock it covers
export function postSupplierInvoice(invoice: SupplierInvoiceRef): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${invoice.id}/post`).then((r) => r.data);
}

// Cancels an invoice, reversing its costing and invoiced quantities when it was posted
export function cancelSupplierInvoice(invoice: SupplierInvoiceRef): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${invoice.id}/cancel`).then((r) => r.data);
}

// Deletes a draft invoice
export function deleteSupplierInvoice(invoice: SupplierInvoiceRef): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${invoice.id}`).then((r) => r.data);
}

// Adds an item or charge line to an invoice
export function addSupplierInvoiceLine({ invoice, data }: AddSupplierInvoiceLineVars): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${invoice.id}/lines`, data).then((r) => r.data);
}

// Updates a line of an invoice
export function updateSupplierInvoiceLine({
  invoice,
  lineId,
  data,
}: UpdateSupplierInvoiceLineVars): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${invoice.id}/lines/${lineId}`, data).then((r) => r.data);
}

// Removes a line from an invoice
export function removeSupplierInvoiceLine({
  invoice,
  lineId,
}: RemoveSupplierInvoiceLineVars): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${invoice.id}/lines/${lineId}`).then((r) => r.data);
}

// Releases an open hold on an invoice, recording why
export function releaseSupplierInvoiceHold({
  invoice,
  holdId,
  reason,
}: ReleaseSupplierInvoiceHoldVars): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${invoice.id}/holds/${holdId}/release`, { reason }).then((r) => r.data);
}

// Fetches the invoices with a line on a purchase order of one of the legal entity's sites
export function getPurchaseOrderInvoicesTable(purchaseOrderId: string): Promise<SupplierInvoicesTableResponse> {
  return axios
    .get<SupplierInvoicesTableResponse>(`commerce-api/le/purchase-orders/${purchaseOrderId}/invoices/table`)
    .then((r) => r.data);
}
