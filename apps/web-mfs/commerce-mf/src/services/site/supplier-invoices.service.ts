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

const supplierBase = (supplierId: string) => `commerce-api/site/suppliers/${supplierId}/invoices`;

// Fetches the supplier's invoices at the session site
export function getSupplierInvoicesTable(supplierId: string): Promise<SupplierInvoicesTableResponse> {
  return axios.get<SupplierInvoicesTableResponse>(`${supplierBase(supplierId)}/table`).then((r) => r.data);
}

// Fetches one of the supplier's invoices with its lines and holds
export function getSupplierInvoice(supplierId: string, invoiceId: string): Promise<SupplierInvoiceDetail> {
  return axios.get<SupplierInvoiceDetail>(`${supplierBase(supplierId)}/${invoiceId}`).then((r) => r.data);
}

// Fetches how many lines and holds one of the supplier's invoices has, one per tab
export function getSupplierInvoiceCounts(supplierId: string, invoiceId: string): Promise<SupplierInvoiceCounts> {
  return axios.get<SupplierInvoiceCounts>(`${supplierBase(supplierId)}/${invoiceId}/counts`).then((r) => r.data);
}

// Fetches the supplier's posted receipt batches at the session site with quantity left to invoice, oldest first
export function getInvoiceableGoodsReceipts(
  supplierId: string,
  params: InvoiceableGoodsReceiptsParams,
): Promise<InvoiceableGoodsReceipt[]> {
  return axios
    .get<InvoiceableGoodsReceipt[]>(`${supplierBase(supplierId)}/invoiceable-goods-receipts`, { params })
    .then((r) => r.data);
}

// Records a draft invoice from the supplier at the session site; the supplier travels in the URL, not the body
export function createSupplierInvoice({ supplierId, ...data }: CreateSupplierInvoicePayload): Promise<SupplierInvoice> {
  return axios.post<CreateResponse<SupplierInvoice>>(supplierBase(supplierId), data).then((r) => r.data.data);
}

// Updates an invoice's header through its supplier
export function updateSupplierInvoice({ invoice, data }: UpdateSupplierInvoiceVars): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${supplierBase(invoice.supplierId)}/${invoice.id}`, data).then((r) => r.data);
}

// Posts a draft invoice through its supplier, setting the final cost of the stock it covers
export function postSupplierInvoice(invoice: SupplierInvoiceRef): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${supplierBase(invoice.supplierId)}/${invoice.id}/post`).then((r) => r.data);
}

// Adds an item or charge line to an invoice through its supplier
export function addSupplierInvoiceLine({ invoice, data }: AddSupplierInvoiceLineVars): Promise<SuccessResponse> {
  return axios
    .post<SuccessResponse>(`${supplierBase(invoice.supplierId)}/${invoice.id}/lines`, data)
    .then((r) => r.data);
}

// Updates a line of an invoice through its supplier
export function updateSupplierInvoiceLine({
  invoice,
  lineId,
  data,
}: UpdateSupplierInvoiceLineVars): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`${supplierBase(invoice.supplierId)}/${invoice.id}/lines/${lineId}`, data)
    .then((r) => r.data);
}

// Removes a line from an invoice through its supplier
export function removeSupplierInvoiceLine({
  invoice,
  lineId,
}: RemoveSupplierInvoiceLineVars): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`${supplierBase(invoice.supplierId)}/${invoice.id}/lines/${lineId}`)
    .then((r) => r.data);
}

// Releases an open hold on an invoice through its supplier, recording why
export function releaseSupplierInvoiceHold({
  invoice,
  holdId,
  reason,
}: ReleaseSupplierInvoiceHoldVars): Promise<SuccessResponse> {
  return axios
    .post<SuccessResponse>(`${supplierBase(invoice.supplierId)}/${invoice.id}/holds/${holdId}/release`, { reason })
    .then((r) => r.data);
}

// Fetches the invoices with a line on a purchase order of the session site
export function getPurchaseOrderInvoicesTable(purchaseOrderId: string): Promise<SupplierInvoicesTableResponse> {
  return axios
    .get<SupplierInvoicesTableResponse>(`commerce-api/site/purchase-orders/${purchaseOrderId}/invoices/table`)
    .then((r) => r.data);
}
