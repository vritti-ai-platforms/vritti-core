import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  type PaymentLinkedAccount,
  type PaymentLinkedAccountStatus,
  PaymentLinkedAccountStatusValues,
} from '@/db/schema';

export class PaymentLinkedAccountDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ description: 'Split-enabled gateway config that collects the payments', example: 'uuid-here' })
  collectorConfigId: string;

  @ApiProperty({ description: 'Bank account the linked account settles into', example: 'uuid-here' })
  bankAccountId: string;

  @ApiProperty({ description: 'Legal entity that holds the recipient bank account', example: 'uuid-here' })
  recipientLegalEntityId: string;

  @ApiPropertyOptional({ example: 'acc_00000000000001', nullable: true })
  providerAccountId: string | null;

  @ApiProperty({ enum: Object.values(PaymentLinkedAccountStatusValues), example: 'IN_REVIEW' })
  status: PaymentLinkedAccountStatus;

  @ApiPropertyOptional({
    description: 'When the provider starts accepting transfers to this account',
    example: '2024-01-16T10:30:00Z',
    nullable: true,
  })
  transfersAllowedAt: string | null;

  @ApiPropertyOptional({ description: 'Why the last registration attempt failed', nullable: true })
  lastError: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: string;

  // Creates a DTO from a linked-account row and the legal entity holding its bank account
  static from(row: PaymentLinkedAccount, recipientLegalEntityId: string): PaymentLinkedAccountDto {
    const dto = new PaymentLinkedAccountDto();
    dto.id = row.id;
    dto.collectorConfigId = row.collectorConfigId;
    dto.bankAccountId = row.bankAccountId;
    dto.recipientLegalEntityId = recipientLegalEntityId;
    dto.providerAccountId = row.providerAccountId ?? null;
    dto.status = row.status;
    dto.transfersAllowedAt = row.transfersAllowedAt?.toISOString() ?? null;
    dto.lastError = row.lastError ?? null;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
