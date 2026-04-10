import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { InvoiceData, InvoiceDetail, InvoicesTableResponse } from '@/schemas/invoices';

export interface CreateInvoicePayload {
  type: string;
  invoiceNumber: string;
  partyType: string;
  partyName: string;
  issuedDate: string;
  dueDate?: string;
  paymentTerms?: string;
  notes?: string;
}

export interface UpdateInvoicePayload {
  dueDate?: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
  status?: string;
}

// Fetches invoices for the data table
export function getInvoicesTable(): Promise<InvoicesTableResponse> {
  return axios
    .get<InvoicesTableResponse>('commerce-api/invoices/table', { showSuccessToast: false })
    .then((r) => r.data);
}

// Creates a new invoice
export function createInvoice(data: CreateInvoicePayload): Promise<InvoiceData> {
  return axios
    .post<InvoiceData>('commerce-api/invoices', data)
    .then((r) => r.data);
}

// Fetches invoice detail with line items
export function getInvoice(id: string): Promise<InvoiceDetail> {
  return axios
    .get<InvoiceDetail>(`commerce-api/invoices/${id}`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Updates an invoice
export function updateInvoice({ id, data }: { id: string; data: UpdateInvoicePayload }): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/invoices/${id}`, data)
    .then((r) => r.data);
}
