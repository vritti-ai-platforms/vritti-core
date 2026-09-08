import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateEmbeddedSignupStateDto {
  /**
   * Where to send the operator once the flow finishes.
   *
   * Supplied by the console because the route belongs to the micro-frontend, not to this server —
   * hardcoding it here would put frontend routing knowledge in the backend. Its origin is held to
   * this deployment's base domain before it is signed, so it cannot be aimed at a site the caller
   * controls.
   */
  @ApiProperty({
    description: "Absolute URL on the caller's own console to return to when the flow finishes.",
    example: 'https://acme.vrittiai.com/settings/whatsapp-accounts',
  })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @IsUrl({ require_protocol: true, require_tld: false })
  returnUrl: string;
}
