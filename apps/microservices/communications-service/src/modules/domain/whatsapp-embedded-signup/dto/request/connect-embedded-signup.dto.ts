import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ConnectEmbeddedSignupDto {
  // Short-lived, single-use OAuth authorization code from the signup callback. Never persisted.
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  code: string;

  // The WABA the caller says they granted
  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  wabaId?: string;

  // The exact redirect URI the authorization request used
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
