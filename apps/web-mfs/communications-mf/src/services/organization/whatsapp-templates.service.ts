import { axios } from '@vritti/quantum-ui/axios';
import type { WhatsappTemplatesTableResponse } from '@/schemas/whatsapp-templates';

// Fetches the WABA's message templates table — rows are read live from Meta
export function getWhatsappTemplatesTable(accountId: string): Promise<WhatsappTemplatesTableResponse> {
  return axios
    .get<WhatsappTemplatesTableResponse>(`communications-api/whatsapp-accounts/${accountId}/templates/table`)
    .then((r) => r.data);
}
