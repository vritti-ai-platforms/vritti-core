import { axios } from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  CreateWhatsappTemplateData,
  SendWhatsappTemplateTestData,
  TemplateLibraryItemData,
  WhatsappTemplateData,
  WhatsappTemplatesTableResponse,
} from '@/schemas/whatsapp-templates';

// Fetches the WABA's message templates table — rows are read live from Meta
export function getWhatsappTemplatesTable(accountId: string): Promise<WhatsappTemplatesTableResponse> {
  return axios
    .get<WhatsappTemplatesTableResponse>(`communications-api/whatsapp-accounts/${accountId}/templates/table`)
    .then((r) => r.data);
}

export interface TemplateLibraryFilters {
  search?: string;
  language?: string;
  category?: string;
}

// Browses Meta's library of pre-written, pre-approved templates
export function getWhatsappTemplateLibrary(
  accountId: string,
  filters: TemplateLibraryFilters,
): Promise<TemplateLibraryItemData[]> {
  return axios
    .get<TemplateLibraryItemData[]>(`communications-api/whatsapp-accounts/${accountId}/templates/library`, {
      params: filters,
    })
    .then((r) => r.data);
}

// Distinct languages Meta's template library ships in — feeds the language selector
export function getWhatsappTemplateLanguages(accountId: string): Promise<string[]> {
  return axios
    .get<string[]>(`communications-api/whatsapp-accounts/${accountId}/templates/library/languages`)
    .then((r) => r.data);
}

// Submits a template to Meta — custom content goes through review; a library reference usually
// approves instantly
export function createWhatsappTemplate(
  accountId: string,
  data: CreateWhatsappTemplateData,
): Promise<CreateResponse<WhatsappTemplateData>> {
  return axios
    .post<CreateResponse<WhatsappTemplateData>>(`communications-api/whatsapp-accounts/${accountId}/templates`, data)
    .then((r) => r.data);
}

// Sends a real, billable template message from one of the WABA's registered numbers
export function sendWhatsappTemplateTest(
  accountId: string,
  data: SendWhatsappTemplateTestData,
): Promise<SuccessResponse> {
  return axios
    .post<SuccessResponse>(`communications-api/whatsapp-accounts/${accountId}/templates/send-test`, data)
    .then((r) => r.data);
}

// Deletes one template node — Meta requires the name alongside the ID (the ID scopes it to one language)
export function deleteWhatsappTemplate(accountId: string, templateId: string, name: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`communications-api/whatsapp-accounts/${accountId}/templates/${templateId}`, {
      params: { name },
    })
    .then((r) => r.data);
}
