import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ListPayoutAccountsInternalQueryDto {
  @ApiProperty({ description: 'The legal entity whose payout accounts are listed, across its bank accounts' })
  @IsUUID()
  legalEntityId: string;
}
