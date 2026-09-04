import type { TableResponse } from '@vritti/quantum-ui/types/api-response';

export interface WhatsappAccountData {
  id: string;
  legalEntityId: string | null;
  metaBusinessId: string;
  wabaId: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  webhooksSubscribed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WhatsappAccountsTableResponse = TableResponse<WhatsappAccountData>;

export interface UpdateWhatsappAccountData {
  legalEntityId?: string | null;
  name?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

// Mirrors EmbeddedSignupConfigResponseDto — served per environment rather than baked into the bundle
export interface EmbeddedSignupConfigData {
  appId: string;
  configId: string | null;
  graphVersion: string;
  enabled: boolean;
}

/**
 * Terminal events the popup reports as a successful finish. CANCEL and ERROR are handled in the hook
 * and never submitted.
 *
 * All five are treated as success because Meta says so — closing the popup on the final screen
 * counts as completion, and each variant still returns the token code plus the asset ids.
 */
export type EmbeddedSignupEventName =
  | 'FINISH'
  | 'FINISH_ONLY_WABA'
  | 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'
  | 'FINISH_OBO_MIGRATION'
  | 'FINISH_GRANT_ONLY_API_ACCESS';

// Mirrors ConnectEmbeddedSignupDto. No zod schema: none of this is typed by a human, it is
// assembled from the popup's two callbacks, and the server re-derives everything it trusts.
export interface ConnectEmbeddedSignupData {
  code: string;
  wabaId: string;
  phoneNumberId?: string;
  businessId?: string;
  event: EmbeddedSignupEventName;
}
