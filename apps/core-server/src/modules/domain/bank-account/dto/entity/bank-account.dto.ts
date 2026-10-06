import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { BankAccount } from '@/db/schema';

export class BankAccountDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'uuid-here' })
  legalEntityId: string;

  @ApiPropertyOptional({ example: 'Primary current account', nullable: true })
  label: string | null;

  @ApiProperty({ example: 'Acme Retail Pvt Ltd' })
  accountHolderName: string;

  @ApiProperty({ example: '123456789012' })
  accountNumber: string;

  @ApiProperty({ example: 'HDFC0001234' })
  ifscCode: string;

  @ApiProperty({ example: 'HDFC Bank' })
  bankName: string;

  @ApiPropertyOptional({ example: 'MG Road, Bengaluru', nullable: true })
  branchName: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: string;

  // Creates a DTO from a bank account row
  static from(row: BankAccount): BankAccountDto {
    const dto = new BankAccountDto();
    dto.id = row.id;
    dto.legalEntityId = row.legalEntityId;
    dto.label = row.label ?? null;
    dto.accountHolderName = row.accountHolderName;
    dto.accountNumber = row.accountNumber;
    dto.ifscCode = row.ifscCode;
    dto.bankName = row.bankName;
    dto.branchName = row.branchName ?? null;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
