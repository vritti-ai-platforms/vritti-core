import { axios } from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  AddSmsProviderTemplateData,
  SmsProviderTemplateData,
  SmsProviderTemplatesTableResponse,
} from '@/schemas/sms-provider-templates';

const base = (providerId: string) => `communications-api/sms-providers/${providerId}/templates`;

// Fetches the templates registered against a provider — Vritti's rows, not a vendor call
export function getSmsProviderTemplatesTable(providerId: string): Promise<SmsProviderTemplatesTableResponse> {
  return axios.get<SmsProviderTemplatesTableResponse>(`${base(providerId)}/table`).then((r) => r.data);
}

// Registers a template; the server confirms it with the vendor before storing anything
export function addSmsProviderTemplate(
  providerId: string,
  data: AddSmsProviderTemplateData,
): Promise<CreateResponse<SmsProviderTemplateData>> {
  return axios.post<CreateResponse<SmsProviderTemplateData>>(base(providerId), data).then((r) => r.data);
}

// Re-reads one template from the vendor, replacing the stored snapshot
export function refreshSmsProviderTemplate(providerId: string, templateId: string): Promise<SmsProviderTemplateData> {
  return axios.post<SmsProviderTemplateData>(`${base(providerId)}/${templateId}/refresh`).then((r) => r.data);
}

// Removes Vritti's row. The template itself stays in MSG91.
export function deleteSmsProviderTemplate(providerId: string, templateId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${base(providerId)}/${templateId}`).then((r) => r.data);
}
