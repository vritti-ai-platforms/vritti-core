import { axios } from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  CreateWhatsappAccountData,
  UpdateWhatsappAccountData,
  WhatsappAccountData,
  WhatsappAccountsTableResponse,
} from '@/schemas/whatsapp-accounts';

// Fetches the WhatsApp accounts table — the server reads the pushed table state and paginates itself
export function getWhatsappAccountsTable(): Promise<WhatsappAccountsTableResponse> {
  return axios.get<WhatsappAccountsTableResponse>('communications-api/whatsapp-accounts/table').then((r) => r.data);
}

// Fetches a single WhatsApp account by ID
export function getWhatsappAccount(id: string): Promise<WhatsappAccountData> {
  return axios.get<WhatsappAccountData>(`communications-api/whatsapp-accounts/${id}`).then((r) => r.data);
}

// Connects a WhatsApp Business Account to the organization
export function createWhatsappAccount(data: CreateWhatsappAccountData): Promise<CreateResponse<WhatsappAccountData>> {
  return axios
    .post<CreateResponse<WhatsappAccountData>>('communications-api/whatsapp-accounts', data)
    .then((r) => r.data);
}

// Updates a WhatsApp account; omitting accessToken leaves the stored credential in place
export function updateWhatsappAccount(id: string, data: UpdateWhatsappAccountData): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`communications-api/whatsapp-accounts/${id}`, data).then((r) => r.data);
}

// Disconnects a WhatsApp account
export function deleteWhatsappAccount(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`communications-api/whatsapp-accounts/${id}`).then((r) => r.data);
}
