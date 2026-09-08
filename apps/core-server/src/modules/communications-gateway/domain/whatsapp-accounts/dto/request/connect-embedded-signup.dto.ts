import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ConnectEmbeddedSignupDto {
  @ApiProperty({
    description:
      'Short-lived, single-use OAuth authorization code from the Facebook Login for Business callback. Never stored.',
  })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({
    description:
      "WABA id, when something reported one. Absent on the redirect flow, which has no window to post it back — it is then derived from the exchanged token's granular scopes, which are what prove control either way.",
    example: '9876543210987654',
  })
  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  wabaId?: string;

  @ApiPropertyOptional({
    description:
      'The exact redirect URI the authorization request used. Repeated on the token exchange because OAuth binds a code to the URI it was issued for; Meta rejects the code without it.',
  })
  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  redirectUri?: string;

  @ApiPropertyOptional({
    description:
      "The customer's business portfolio, reported by the popup. Preferred over deriving it from the WABA's owner_business_info, which needs business_management advanced access.",
    example: '2729063490586005',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  businessId?: string;
}
