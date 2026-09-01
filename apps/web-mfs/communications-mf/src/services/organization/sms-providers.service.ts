import { axios } from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  CreateSmsProviderData,
  SmsProviderData,
  SmsProvidersTableResponse,
  UpdateSmsProviderData,
} from '@/schemas/sms-providers';

// Fetches the SMS providers table — the org's own rows plus Vritti's platform rows
export function getSmsProvidersTable(): Promise<SmsProvidersTableResponse> {
  return axios.get<SmsProvidersTableResponse>('communications-api/sms-providers/table').then((r) => r.data);
}

export function getSmsProvider(id: string): Promise<SmsProviderData> {
  return axios.get<SmsProviderData>(`communications-api/sms-providers/${id}`).then((r) => r.data);
}

// Connects an organization-owned provider account with its credentials
export function createSmsProvider(data: CreateSmsProviderData): Promise<CreateResponse<SmsProviderData>> {
  return axios.post<CreateResponse<SmsProviderData>>('communications-api/sms-providers', data).then((r) => r.data);
}

// Updates a provider; omitting credentials leaves the stored secrets in place
export function updateSmsProvider(id: string, data: UpdateSmsProviderData): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`communications-api/sms-providers/${id}`, data).then((r) => r.data);
}

export function deleteSmsProvider(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`communications-api/sms-providers/${id}`).then((r) => r.data);
}
