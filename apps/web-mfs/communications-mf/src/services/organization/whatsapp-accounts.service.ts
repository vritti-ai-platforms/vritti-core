import { axios } from '@vritti/quantum-ui/axios';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  CreateEmbeddedSignupStateData,
  EmbeddedSignupConfigData,
  EmbeddedSignupStateData,
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

// Whether this deployment can run Embedded Signup at all
export function getEmbeddedSignupConfig(): Promise<EmbeddedSignupConfigData> {
  return axios
    .get<EmbeddedSignupConfigData>('communications-api/whatsapp-accounts/embedded-signup/config')
    .then((r) => r.data);
}

/**
 * Starts a connect and returns the broker URL to open.
 *
 * The popup cannot be opened from this origin: Meta enforces the signup SDK's host against a fixed
 * allowed-domain list and every organization has its own subdomain, so the flow runs on one shared
 * origin. This call is what authorises the attempt and hands back where to run it.
 */
export function createWhatsappConnectState(data: CreateEmbeddedSignupStateData): Promise<EmbeddedSignupStateData> {
  return axios
    .post<EmbeddedSignupStateData>('communications-api/whatsapp-accounts/embedded-signup/state', data)
    .then((r) => r.data);
}

// Starts a credential replacement for one account. The account id is bound into the minted state,
// so the completion on the broker origin cannot be pointed at a different row.
export function createWhatsappReconnectState(
  id: string,
  data: CreateEmbeddedSignupStateData,
): Promise<EmbeddedSignupStateData> {
  return axios
    .post<EmbeddedSignupStateData>(`communications-api/whatsapp-accounts/${id}/reconnect/state`, data)
    .then((r) => r.data);
}
