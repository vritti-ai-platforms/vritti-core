import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type PaymentGatewayConfig, type PaymentGatewayConfigKind, PaymentGatewayConfigKindValues } from '@/db/schema';
import {
  type PaymentGatewayConfigStatus,
  PaymentGatewayConfigStatusValues,
  paymentGatewayConfigStatus,
} from '../../payment-gateway-config-status';

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

  @ApiPropertyOptional({
    description: 'The public half of the credential pair; withheld from organizations on PLATFORM rows',
    example: 'rzp_live_AbCdEf123456',
    nullable: true,
  })
  keyId: string | null;

  @ApiProperty({ description: 'Whether a webhook signing secret is on file', example: true })
  hasWebhookSecret: boolean;

  @ApiProperty({ description: "The main account's id at the gateway", example: 'acc_Tpmw33BnyMhFUf' })
  gatewayAccountId: string;

  @ApiProperty({ description: "Vritti's fee in basis points, applied on a PLATFORM row only", example: 150 })
  platformFeeBps: number;

  @ApiPropertyOptional({ description: "The catalog gateway's logo for light backgrounds", nullable: true })
  logoLightUrl: string | null;

  @ApiPropertyOptional({ description: "The catalog gateway's logo for dark backgrounds", nullable: true })
  logoDarkUrl: string | null;

  @ApiPropertyOptional({
    description: 'When the stored credentials last passed the provider check',
    example: '2024-01-15T10:30:00Z',
    nullable: true,
  })
  verifiedAt: string | null;

  @ApiPropertyOptional({
    description: 'When the first webhook signed with this config’s secret arrived; null until then',
    example: '2024-01-15T10:35:00Z',
    nullable: true,
  })
  webhookVerifiedAt: string | null;

  @ApiPropertyOptional({ description: 'When the latest signed webhook arrived', nullable: true })
  lastWebhookAt: string | null;

  @ApiProperty({
    description:
      'ACTIVE takes payments; KEYS_NOT_VERIFIED and WAITING_FOR_WEBHOOK (a gateway that signs webhooks with its own secret, before the first signed webhook) do not',
    enum: Object.values(PaymentGatewayConfigStatusValues),
    example: 'ACTIVE',
  })
  status: PaymentGatewayConfigStatus;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: string;

  // Creates a DTO without secrets, withholding Vritti's key id from an organization (tenantView)
  static from(row: PaymentGatewayConfig, options: { tenantView?: boolean } = {}): PaymentGatewayConfigDto {
    const dto = new PaymentGatewayConfigDto();
    dto.id = row.id;
    dto.kind = row.kind;
    dto.gatewayCode = row.gatewayCode;
    dto.keyId = options.tenantView && row.kind === PaymentGatewayConfigKindValues.PLATFORM ? null : row.keyId;
    dto.hasWebhookSecret = row.webhookSecret !== null;
    dto.gatewayAccountId = row.gatewayAccountId;
    dto.platformFeeBps = row.platformFeeBps;
    dto.logoLightUrl = row.logoLightUrl ?? null;
    dto.logoDarkUrl = row.logoDarkUrl ?? null;
    dto.verifiedAt = row.verifiedAt?.toISOString() ?? null;
    dto.webhookVerifiedAt = row.webhookVerifiedAt?.toISOString() ?? null;
    dto.lastWebhookAt = row.lastWebhookAt?.toISOString() ?? null;
    dto.status = paymentGatewayConfigStatus(row);
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
