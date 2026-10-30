import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  CreatePaymentTermPayload,
  PaymentTermData,
  PaymentTermRuleFormData,
  PaymentTermsTableResponse,
  UpdatePaymentTermPayload,
} from '@/schemas/payment-terms';

const BASE = 'commerce-api/payment-terms';

export function getPaymentTermsTable(): Promise<PaymentTermsTableResponse> {
  return axios.get<PaymentTermsTableResponse>(`${BASE}/table`, { showSuccessToast: false }).then((r) => r.data);
}

export function getPaymentTerm(id: string): Promise<PaymentTermData> {
  return axios.get<PaymentTermData>(`${BASE}/${id}`, { showSuccessToast: false }).then((r) => r.data);
}

export function createPaymentTerm(data: CreatePaymentTermPayload): Promise<PaymentTermData> {
  return axios.post<CreateResponse<PaymentTermData>>(BASE, data).then((r) => r.data.data);
}

export function updatePaymentTerm({
  id,
  data,
}: {
  id: string;
  data: UpdatePaymentTermPayload;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}`, data).then((r) => r.data);
}

export function activatePaymentTerm(id: string): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/activate`).then((r) => r.data);
}

export function deactivatePaymentTerm(id: string): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/deactivate`).then((r) => r.data);
}

export function deletePaymentTerm(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${id}`).then((r) => r.data);
}

export function addPaymentTermRule({
  paymentTermId,
  data,
}: {
  paymentTermId: string;
  data: PaymentTermRuleFormData;
}): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${paymentTermId}/rules`, data).then((r) => r.data);
}

export function updatePaymentTermRule({
  paymentTermId,
  ruleId,
  data,
}: {
  paymentTermId: string;
  ruleId: string;
  data: PaymentTermRuleFormData;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${paymentTermId}/rules/${ruleId}`, data).then((r) => r.data);
}

export function deletePaymentTermRule({
  paymentTermId,
  ruleId,
}: {
  paymentTermId: string;
  ruleId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${paymentTermId}/rules/${ruleId}`).then((r) => r.data);
}
