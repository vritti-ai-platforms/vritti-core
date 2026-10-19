import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type PaymentGatewayConfig, type PaymentGatewayConfigKind, PaymentGatewayConfigKindValues } from '@/db/schema';

export class PaymentGatewayConfigDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({
    description: "PLATFORM is one of Vritti's gateways on this deployment; ORG is the organization's own account",
    enum: Object.values(PaymentGatewayConfigKindValues),
    example: 'ORG',
  })
  kind: PaymentGatewayConfigKind;

  @ApiProperty({ example: 'razorpay' })
  gatewayCode: string;

  @ApiProperty({ description: 'Tells the rows of a group apart; unique within it', example: 'Main Razorpay' })
  label: string;

  @ApiPropertyOptional({
    description: 'The public half of the credential pair; withheld from organizations on PLATFORM rows',
    example: 'rzp_live_AbCdEf123456',
    nullable: true,
  })
  keyId: string | null;

  @ApiProperty({ description: 'Whether a webhook signing secret is on file', example: true })
  hasWebhookSecret: boolean;

  @ApiPropertyOptional({ example: 'MID12345', nullable: true })
  providerMerchantId: string | null;

  @ApiProperty({ description: "Vritti's fee in basis points, applied on a PLATFORM row only", example: 150 })
  platformFeeBps: number;

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

  // Creates a DTO from a config row, leaving every secret column behind. An organization reading a PLATFORM row
  // (tenantView) does not get Vritti's key id either
  static from(row: PaymentGatewayConfig, options: { tenantView?: boolean } = {}): PaymentGatewayConfigDto {
    const dto = new PaymentGatewayConfigDto();
    dto.id = row.id;
    dto.kind = row.kind;
    dto.gatewayCode = row.gatewayCode;
    dto.label = row.label;
    dto.keyId = options.tenantView && row.kind === PaymentGatewayConfigKindValues.PLATFORM ? null : row.keyId;
    dto.hasWebhookSecret = row.webhookSecret !== null;
    dto.providerMerchantId = row.providerMerchantId ?? null;
    dto.platformFeeBps = row.platformFeeBps;
    dto.verifiedAt = row.verifiedAt?.toISOString() ?? null;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
