import { Trim } from '@vritti/api-sdk/decorators';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

// Embedded Signup finish events. CANCEL never reaches the server — the popup hook drops it.
// FINISH_ONLY_WABA means the user created the WABA but never added a phone number to it; that is a
// legitimate half-done state, so it is accepted and the empty phone-numbers list tells the story.
export type EmbeddedSignupEvent =
  | 'FINISH'
  | 'FINISH_ONLY_WABA'
  | 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'
  | 'FINISH_OBO_MIGRATION'
  | 'FINISH_GRANT_ONLY_API_ACCESS';

const FINISH_EVENTS: EmbeddedSignupEvent[] = [
  'FINISH',
  'FINISH_ONLY_WABA',
  'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING',
  'FINISH_OBO_MIGRATION',
  'FINISH_GRANT_ONLY_API_ACCESS',
];

export class ConnectEmbeddedSignupDto {
  // Short-lived, single-use OAuth authorization code from the FB.login callback. Never persisted.
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  code: string;

  // From the popup's WA_EMBEDDED_SIGNUP postMessage. Untrusted — the token's granular scopes are
  // what actually prove the caller controls this WABA (see WhatsappEmbeddedSignupDomainService).
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  wabaId: string;

  // Present on FINISH, absent on FINISH_ONLY_WABA and on the coexistence finish, whose payload
  // carries waba_id only. Not stored — numbers are read live from Meta.
  @IsOptional()
  @IsString()
  @MaxLength(64)
  phoneNumberId?: string;

  // The customer's business portfolio as the popup reported it. Trusted only after the token proves
  // control of the WABA, and only as a fallback source for a field Meta may not return on the node.
  @IsOptional()
  @IsString()
  @MaxLength(64)
  businessId?: string;

  @IsIn(FINISH_EVENTS)
  event: EmbeddedSignupEvent;
}
