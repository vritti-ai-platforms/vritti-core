import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type PaymentChannelType, PaymentChannelTypeValues, PaymentGatewayConfigKindValues } from '@/db/schema';
import type { PayoutChannelDetail } from '../../repositories/payout-channel.repository';

export class PayoutChannelGatewayDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ enum: Object.values(PaymentGatewayConfigKindValues), example: 'PLATFORM' })
  kind: 'PLATFORM' | 'ORG';

  @ApiProperty({ example: 'razorpay' })
  gatewayCode: string;

  @ApiProperty({ example: 'Vritti Razorpay' })
  label: string;
}

export class PayoutChannelBankDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiPropertyOptional({ example: 'Main current account', nullable: true })
  label: string | null;

  @ApiProperty({ example: 'HDFC Bank' })
  bankName: string;

  @ApiProperty({ description: 'Last four digits of the account number', example: '1234' })
  accountNumberLast4: string;
}

// The payout account a channel uses, flattened for the screens
export class PayoutChannelAccountDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'acc_Hx81aBcDeF' })
  gatewayAccountId: string;

  @ApiProperty({ description: "True when the account is the gateway's own main account", example: false })
  isMainAccount: boolean;

  @ApiProperty({ type: PayoutChannelGatewayDto })
  paymentGatewayConfig: PayoutChannelGatewayDto;

  @ApiProperty({ type: PayoutChannelBankDto })
  bankAccount: PayoutChannelBankDto;
}

export class PayoutChannelDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'uuid-here' })
  legalEntityId: string;

  @ApiPropertyOptional({ description: 'Set when the channel covers one site only', nullable: true })
  siteId: string | null;

  @ApiPropertyOptional({ description: 'Set when the channel covers one app only', nullable: true })
  appId: string | null;

  @ApiPropertyOptional({
    description: 'Set when the channel covers one sales channel only',
    enum: Object.values(PaymentChannelTypeValues),
    nullable: true,
  })
  channel: PaymentChannelType | null;

  @ApiProperty({ type: PayoutChannelAccountDto })
  payoutAccount: PayoutChannelAccountDto;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: string;

  // The full account number never leaves core
  static from(row: PayoutChannelDetail): PayoutChannelDto {
    const dto = new PayoutChannelDto();
    dto.id = row.id;
    dto.legalEntityId = row.legalEntityId;
    dto.siteId = row.siteId;
    dto.appId = row.appId;
    dto.channel = row.channel;
    dto.payoutAccount = {
      id: row.account.id,
      gatewayAccountId: row.account.gatewayAccountId,
      isMainAccount: row.account.isMainAccount,
      paymentGatewayConfig: { ...row.gateway },
      bankAccount: {
        id: row.bank.id,
        label: row.bank.label,
        bankName: row.bank.bankName,
        accountNumberLast4: row.bank.accountNumber.slice(-4),
      },
    };
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
