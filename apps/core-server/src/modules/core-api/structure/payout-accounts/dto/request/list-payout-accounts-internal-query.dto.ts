import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

// One of the two: a bank account's payout accounts, or every one of a legal entity
export class ListPayoutAccountsInternalQueryDto {
  @ApiPropertyOptional({ description: 'The bank account whose payout accounts are listed' })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional({ description: 'The legal entity whose payout accounts are listed, across its bank accounts' })
  @IsOptional()
  @IsUUID()
  legalEntityId?: string;
}
