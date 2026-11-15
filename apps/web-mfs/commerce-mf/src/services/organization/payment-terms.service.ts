import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  CreatePaymentTermPayload,
  PaymentScheduleData,
  PaymentScheduleQuery,
  PaymentTermBaseline,
  PaymentTermData,
  PaymentTermDetailData,
  PaymentTermRuleFormData,
  PaymentTermRulesData,
  PaymentTermsTableResponse,
  UpdatePaymentTermPayload,
} from '@/schemas/payment-terms';

const BASE = 'commerce-api/org/payment-terms';

export function getPaymentTermsTable(): Promise<PaymentTermsTableResponse> {
  return axios.get<PaymentTermsTableResponse>(`${BASE}/table`, { showSuccessToast: false }).then((r) => r.data);
}

export function getPaymentTerm(id: string): Promise<PaymentTermDetailData> {
  return axios.get<PaymentTermDetailData>(`${BASE}/${id}`, { showSuccessToast: false }).then((r) => r.data);
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

export function changePaymentTermBaseline({
  id,
  baseline,
}: {
  id: string;
  baseline: PaymentTermBaseline;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}/baseline`, { baseline }).then((r) => r.data);
}

export function publishPaymentTerm(id: string): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/publish`).then((r) => r.data);
}

export function unpublishPaymentTerm(id: string): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/unpublish`).then((r) => r.data);
}

export function deletePaymentTerm(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${id}`).then((r) => r.data);
}

export function getPaymentTermRules(paymentTermId: string): Promise<PaymentTermRulesData> {
  return axios
    .get<PaymentTermRulesData>(`${BASE}/${paymentTermId}/rules`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function getPaymentSchedule(paymentTermId: string, query: PaymentScheduleQuery): Promise<PaymentScheduleData> {
  return axios
    .get<PaymentScheduleData>(`${BASE}/${paymentTermId}/schedule`, {
      params: query,
      showSuccessToast: false,
      showErrorToast: false,
    })
    .then((r) => r.data);
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
