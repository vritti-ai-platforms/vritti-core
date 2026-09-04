import { axios } from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  ConnectEmbeddedSignupData,
  EmbeddedSignupConfigData,
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

// Updates a WhatsApp account's own settings. Credentials are never written here — only Embedded
// Signup can supply one, which is what keeps the ownership check unskippable.
export function updateWhatsappAccount(id: string, data: UpdateWhatsappAccountData): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`communications-api/whatsapp-accounts/${id}`, data).then((r) => r.data);
}

// Disconnects a WhatsApp account
export function deleteWhatsappAccount(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`communications-api/whatsapp-accounts/${id}`).then((r) => r.data);
}

// Public Meta app values the browser needs before it can open the signup popup
export function getEmbeddedSignupConfig(): Promise<EmbeddedSignupConfigData> {
  return axios
    .get<EmbeddedSignupConfigData>('communications-api/whatsapp-accounts/embedded-signup/config')
    .then((r) => r.data);
}

// Connects a WABA from an Embedded Signup result. Name, business portfolio, and the access token are
// all resolved server-side from Meta — only the authorization code and the reported ids are sent.
export function connectWhatsappAccountEmbedded(
  data: ConnectEmbeddedSignupData,
): Promise<CreateResponse<WhatsappAccountData>> {
  return axios
    .post<CreateResponse<WhatsappAccountData>>('communications-api/whatsapp-accounts/embedded-signup', data)
    .then((r) => r.data);
}

// Replaces one account's credential from a fresh signup result, keeping the same account row
export function reconnectWhatsappAccount(id: string, data: ConnectEmbeddedSignupData): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`communications-api/whatsapp-accounts/${id}/reconnect`, data).then((r) => r.data);
}
