import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateEmbeddedSignupStateDto {
  // Where to send the operator once the flow finishes
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
