import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ConnectEmbeddedSignupDto {
  // Short-lived, single-use OAuth authorization code from the signup callback. Never persisted.
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  code: string;

  /**
   * The WABA the caller says they granted.
   *
   * Optional since the flow moved to a top-level OAuth redirect: there is no opener window, so no
   * WA_EMBEDDED_SIGNUP postMessage, so nothing reports it. When absent it is derived from the
   * exchanged token's granular scopes, which is where the authority always lived — when present it
   * is still only ever verified against them, never trusted (see WhatsappEmbeddedSignupDomainService).
   */
  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  wabaId?: string;

  /**
   * The exact redirect URI the authorization request used.
   *
   * Has to be repeated on the token exchange or Meta rejects the code — OAuth binds a code to the
   * URI it was issued for. Optional only because a flow that sends no redirect URI (the old SDK
   * popup) has none to repeat.
   */
  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  redirectUri?: string;

  // The customer's business portfolio as the popup reported it. Trusted only after the token proves
  // control of the WABA, and only as a fallback source for a field Meta may not return on the node.
  @IsOptional()
  @IsString()
  @MaxLength(64)
  businessId?: string;
}
