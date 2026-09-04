import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ConnectEmbeddedSignupDto {
  @ApiProperty({
    description:
      'Short-lived, single-use OAuth authorization code from the Facebook Login for Business callback. Never stored.',
  })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description:
      "WABA id from the popup's WA_EMBEDDED_SIGNUP message. Untrusted — the exchanged token's granular scopes are what prove control of the account.",
    example: '9876543210987654',
  })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  wabaId: string;

  @ApiPropertyOptional({
    description: 'Sender the popup provisioned. Absent when the user finished without adding a number.',
    example: '1234567890123456',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  phoneNumberId?: string;

  @ApiPropertyOptional({
    description:
      "The customer's business portfolio, reported by the popup. Preferred over deriving it from the WABA's owner_business_info, which needs business_management advanced access.",
    example: '2729063490586005',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  businessId?: string;

  @ApiProperty({
    enum: [
      'FINISH',
      'FINISH_ONLY_WABA',
      'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING',
      'FINISH_OBO_MIGRATION',
      'FINISH_GRANT_ONLY_API_ACCESS',
    ],
    description: 'Terminal event the popup reported. CANCEL and ERROR are dropped client-side.',
  })
  @IsIn([
    'FINISH',
    'FINISH_ONLY_WABA',
    'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING',
    'FINISH_OBO_MIGRATION',
    'FINISH_GRANT_ONLY_API_ACCESS',
  ])
  event: string;
}
