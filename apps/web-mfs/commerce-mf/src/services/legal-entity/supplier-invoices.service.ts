import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  AddSupplierInvoiceLineVars,
  CreateSupplierInvoicePayload,
  RemoveSupplierInvoiceLineVars,
  SupplierInvoice,
  SupplierInvoiceDetail,
  SupplierInvoiceRef,
  SupplierInvoicesTableResponse,
  UpdateSupplierInvoiceLineVars,
  UpdateSupplierInvoiceVars,
} from '@/schemas/supplier-invoices';

const BASE = 'commerce-api/le/supplier-invoices';
const purchaseOrderBase = (purchaseOrderId: string) => `commerce-api/le/purchase-orders/${purchaseOrderId}/invoices`;

// Fetches the invoices of the legal entity's sites for the data table, narrowed by the table's saved context
export function getSupplierInvoicesTable(): Promise<SupplierInvoicesTableResponse> {
  return axios.get<SupplierInvoicesTableResponse>(`${BASE}/table`).then((r) => r.data);
}

// Fetches an invoice with its lines, flags and linked receipts
export function getSupplierInvoice(invoiceId: string): Promise<SupplierInvoiceDetail> {
  return axios.get<SupplierInvoiceDetail>(`${BASE}/${invoiceId}`).then((r) => r.data);
}

// Records a draft invoice billing a purchase order of one of the legal entity's sites
export function createSupplierInvoice(data: CreateSupplierInvoicePayload): Promise<SupplierInvoice> {
  return axios.post<CreateResponse<SupplierInvoice>>(BASE, data).then((r) => r.data.data);
}

// Updates an invoice's header
export function updateSupplierInvoice({ invoice, data }: UpdateSupplierInvoiceVars): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${invoice.id}`, data).then((r) => r.data);
}

// Posts a draft invoice, setting the final cost of the stock it bills
export function postSupplierInvoice(invoice: SupplierInvoiceRef): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${invoice.id}/post`).then((r) => r.data);
}

// Cancels an invoice, reversing its costing when it was posted
export function cancelSupplierInvoice(invoice: SupplierInvoiceRef): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${invoice.id}/cancel`).then((r) => r.data);
}

// Deletes a draft invoice
export function deleteSupplierInvoice(invoice: SupplierInvoiceRef): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${invoice.id}`).then((r) => r.data);
}

// Adds a billed line to an invoice
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

// Fetches the invoices billing a purchase order of one of the legal entity's sites
export function getPurchaseOrderInvoicesTable(purchaseOrderId: string): Promise<SupplierInvoicesTableResponse> {
  return axios.get<SupplierInvoicesTableResponse>(`${purchaseOrderBase(purchaseOrderId)}/table`).then((r) => r.data);
}

// Records a draft invoice billing the purchase order; the order travels in the URL, not the body
export function createPurchaseOrderInvoice({
  purchaseOrderId,
  ...data
}: CreateSupplierInvoicePayload): Promise<SupplierInvoice> {
  return axios.post<CreateResponse<SupplierInvoice>>(purchaseOrderBase(purchaseOrderId), data).then((r) => r.data.data);
}
