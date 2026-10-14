import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type PaymentGatewayConfig, type PaymentGatewayConfigType, PaymentGatewayConfigTypeValues } from '@/db/schema';

export class PaymentGatewayConfigDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'uuid-here' })
  legalEntityId: string;

  @ApiProperty({ example: 'uuid-here' })
  bankAccountId: string;

  @ApiProperty({ enum: Object.values(PaymentGatewayConfigTypeValues), example: 'APP' })
  type: PaymentGatewayConfigType;

  @ApiPropertyOptional({ example: 'uuid-here', nullable: true })
  siteId: string | null;

  @ApiPropertyOptional({ example: 'uuid-here', nullable: true })
  appId: string | null;

  @ApiProperty({ example: 'razorpay' })
  gatewayCode: string;

  @ApiPropertyOptional({ example: 'Storefront Razorpay', nullable: true })
  label: string | null;

  @ApiProperty({ description: 'The public half of the credential pair', example: 'rzp_live_AbCdEf123456' })
  keyId: string;

  @ApiProperty({ description: 'Whether a webhook signing secret is on file', example: true })
  hasWebhookSecret: boolean;

  @ApiPropertyOptional({ example: 'MID12345', nullable: true })
  providerMerchantId: string | null;

  @ApiProperty({
    description: 'Whether this config collects payments that are split to linked accounts',
    example: false,
  })
  splitEnabled: boolean;

  @ApiPropertyOptional({
    description: 'When the stored credentials last passed the provider check',
    example: '2024-01-15T10:30:00Z',
    nullable: true,
  })
  verifiedAt: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: string;

  // Creates a DTO from a config row, leaving every secret column behind
  static from(row: PaymentGatewayConfig): PaymentGatewayConfigDto {
    const dto = new PaymentGatewayConfigDto();
    dto.id = row.id;
    dto.legalEntityId = row.legalEntityId;
    dto.bankAccountId = row.bankAccountId;
    dto.type = row.type;
    dto.siteId = row.siteId ?? null;
    dto.appId = row.appId ?? null;
    dto.gatewayCode = row.gatewayCode;
    dto.label = row.label ?? null;
    dto.keyId = row.keyId;
    dto.hasWebhookSecret = row.webhookSecret !== null;
    dto.providerMerchantId = row.providerMerchantId ?? null;
    dto.splitEnabled = row.splitEnabled;
    dto.verifiedAt = row.verifiedAt?.toISOString() ?? null;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
