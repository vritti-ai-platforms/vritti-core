import axios from '@vritti/quantum-ui/axios';
import type { PaymentData } from '@/schemas/invoices';

export interface CreatePaymentPayload {
  invoiceId: string;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
}

// Creates a payment for an invoice
export function createPayment(data: CreatePaymentPayload): Promise<PaymentData> {
  return axios
    .post<PaymentData>('commerce-api/payments', data)
    .then((r) => r.data);
}

// Fetches payments for an invoice
export function getPayments(invoiceId: string): Promise<PaymentData[]> {
  return axios
    .get<PaymentData[]>(`commerce-api/payments/by-invoice/${invoiceId}`, { showSuccessToast: false })
    .then((r) => r.data);
}
