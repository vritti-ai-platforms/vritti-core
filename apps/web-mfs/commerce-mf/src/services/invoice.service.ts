import type { AxiosResponse } from 'axios';
import axios from '@vritti/quantum-ui/axios';
import type { Invoice } from '../schemas';

interface SuccessResponse {
  success: boolean;
  message: string;
}

// Generates an invoice from an order
export function generateInvoice(orderId: string): Promise<Invoice> {
  return axios
    .post<Invoice>(`commerce-api/invoices/generate/${orderId}`, {}, { successMessage: 'Invoice generated' })
    .then((r: AxiosResponse<Invoice>) => r.data);
}

// Fetches all invoices for an org+bu
export function getInvoices(businessUnitId: string): Promise<Invoice[]> {
  return axios
    .get<Invoice[]>('commerce-api/invoices', { params: { businessUnitId } })
    .then((r: AxiosResponse<Invoice[]>) => r.data);
}

// Fetches a single invoice by ID
export function getInvoiceById(id: string): Promise<Invoice> {
  return axios.get<Invoice>(`commerce-api/invoices/${id}`).then((r: AxiosResponse<Invoice>) => r.data);
}

// Updates the invoice status
export function updateInvoiceStatus(id: string, status: string): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(
      `commerce-api/invoices/${id}/status`,
      { status },
      { successMessage: 'Invoice status updated' },
    )
    .then((r: AxiosResponse<SuccessResponse>) => r.data);
}
