import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentGatewayConfigKindValues } from '@/db/schema';
import type { PayoutAccountDetail } from '../../repositories/payout-account.repository';

export class PayoutAccountGatewayDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ enum: Object.values(PaymentGatewayConfigKindValues), example: 'PLATFORM' })
  kind: 'PLATFORM' | 'ORG';

  @ApiProperty({ example: 'razorpay' })
  gatewayCode: string;

  @ApiProperty({ example: 'Vritti Razorpay' })
  label: string;
}

export class PayoutAccountBankDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiPropertyOptional({ example: 'Main current account', nullable: true })
  label: string | null;

  @ApiProperty({ example: 'HDFC Bank' })
  bankName: string;

  @ApiProperty({ description: 'Last four digits of the account number', example: '1234' })
  accountNumberLast4: string;
}

export class PayoutAccountDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'uuid-here' })
  legalEntityId: string;

  @ApiProperty({ type: PayoutAccountGatewayDto })
  paymentGatewayConfig: PayoutAccountGatewayDto;

  @ApiProperty({ type: PayoutAccountBankDto })
  bankAccount: PayoutAccountBankDto;

  @ApiProperty({ description: "The receiving account's id at the gateway", example: 'acc_Hx81aBcDeF' })
  gatewayAccountId: string;

  @ApiProperty({
    description:
      "True when gatewayAccountId is the gateway's own main account, so the share stays there; false when it is a linked account the share is transferred to",
    example: false,
  })
  isMainAccount: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: string;

  // Creates a DTO from a detailed row; the full account number never leaves core
  static from(row: PayoutAccountDetail): PayoutAccountDto {
    const dto = new PayoutAccountDto();
    dto.id = row.id;
    dto.legalEntityId = row.legalEntityId;
    dto.paymentGatewayConfig = { ...row.gateway };
    dto.bankAccount = {
      id: row.bank.id,
      label: row.bank.label,
      bankName: row.bank.bankName,
      accountNumberLast4: row.bank.accountNumber.slice(-4),
    };
    dto.gatewayAccountId = row.gatewayAccountId;
    dto.isMainAccount = row.isMainAccount;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
