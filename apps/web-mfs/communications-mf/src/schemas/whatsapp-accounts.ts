import type { TableResponse } from '@vritti/quantum-ui/types/api-response';

export interface WhatsappAccountData {
  id: string;
  legalEntityId: string | null;
  metaBusinessId: string;
  wabaId: string;
  name: string;
  isActive: boolean;
  webhooksSubscribed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WhatsappAccountsTableResponse = TableResponse<WhatsappAccountData>;

export interface UpdateWhatsappAccountData {
  legalEntityId?: string | null;
  name?: string;
  isActive?: boolean;
}

// Mirrors EmbeddedSignupConfigResponseDto — one flag. The Meta ids stay server-side now that the
// broker spawns the flow, so there is nothing else for the console to know.
export interface EmbeddedSignupConfigData {
  enabled: boolean;
}

// Mirrors CreateEmbeddedSignupStateDto — the console names its own return route, because that route
// belongs to the micro-frontend rather than to the server
export interface CreateEmbeddedSignupStateData {
  returnUrl: string;
}

// Mirrors EmbeddedSignupStateResponseDto — where to send the operator, signed state included
export interface EmbeddedSignupStateData {
  url: string;
}

/**
 * Query keys the flow comes back on.
 *
 * The whole round trip happens in one tab: the console navigates away into Meta and the callback
 * redirects back here with the outcome attached, so there is no popup to message and no page of ours
 * in between. Must match RESULT_PARAM / MESSAGE_PARAM in core-server's broker service.
 */
export const EMBEDDED_SIGNUP_RESULT_PARAM = 'whatsapp';
export const EMBEDDED_SIGNUP_MESSAGE_PARAM = 'whatsappMessage';

/**
 * Relay from the popup back to the console window that opened it.
 *
 * The popup ends the round trip on this same app — the callback redirects it to the console URL it
 * started from — so the window that has the result is not the window the operator is looking at. It
 * hands the outcome over and closes itself.
 *
 * Same-origin by construction (both windows are this app on the tenant host), which is why the
 * listener can compare against `window.location.origin` exactly.
 */
export const EMBEDDED_SIGNUP_RELAY_MESSAGE = 'VRITTI_WHATSAPP_CONNECT_RELAY';

export interface EmbeddedSignupRelayMessage {
  type: typeof EMBEDDED_SIGNUP_RELAY_MESSAGE;
  ok: boolean;
  message?: string;
}
