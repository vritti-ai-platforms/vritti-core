import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type PaymentChannelType, PaymentChannelTypeValues } from '@/db/schema';
import type { PayoutChannelDetail } from '../../repositories/payout-channel.repository';

export class PayoutChannelBankDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'HDFC Bank' })
  bankName: string;

  @ApiProperty({ description: 'Last four digits of the account number', example: '1234' })
  accountNumberLast4: string;
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

  @ApiProperty({ type: PayoutChannelBankDto })
  bankAccount: PayoutChannelBankDto;

  @ApiProperty({ description: "The bank account's payout accounts switched on for this scope", type: [String] })
  payoutAccountIds: string[];

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
    dto.bankAccount = {
      id: row.bank.id,
      bankName: row.bank.bankName,
      accountNumberLast4: row.bank.accountNumber.slice(-4),
    };
    dto.payoutAccountIds = row.payoutAccountIds;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
