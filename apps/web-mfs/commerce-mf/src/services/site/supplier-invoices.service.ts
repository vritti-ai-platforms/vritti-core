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

const supplierBase = (supplierId: string) => `commerce-api/site/suppliers/${supplierId}/invoices`;
const purchaseOrderBase = (purchaseOrderId: string) => `commerce-api/purchase-orders/${purchaseOrderId}/invoices`;

// Fetches the supplier's invoices at the session site
export function getSupplierInvoicesTable(supplierId: string): Promise<SupplierInvoicesTableResponse> {
  return axios.get<SupplierInvoicesTableResponse>(`${supplierBase(supplierId)}/table`).then((r) => r.data);
}

// Fetches one of the supplier's invoices with its lines, flags and linked receipts
export function getSupplierInvoice(supplierId: string, invoiceId: string): Promise<SupplierInvoiceDetail> {
  return axios.get<SupplierInvoiceDetail>(`${supplierBase(supplierId)}/${invoiceId}`).then((r) => r.data);
}

// Records a draft invoice billing one of the session site's purchase orders from the supplier
export function createSupplierInvoice(
  supplierId: string,
  data: CreateSupplierInvoicePayload,
): Promise<SupplierInvoice> {
  return axios.post<CreateResponse<SupplierInvoice>>(supplierBase(supplierId), data).then((r) => r.data.data);
}

// Updates an invoice's header through its supplier
export function updateSupplierInvoice({ invoice, data }: UpdateSupplierInvoiceVars): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${supplierBase(invoice.supplierId)}/${invoice.id}`, data).then((r) => r.data);
}

// Posts a draft invoice through its supplier, setting the final cost of the stock it bills
export function postSupplierInvoice(invoice: SupplierInvoiceRef): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${supplierBase(invoice.supplierId)}/${invoice.id}/post`).then((r) => r.data);
}

// Adds a billed line to an invoice through its supplier
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

// Fetches the invoices billing a purchase order of the session site
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
