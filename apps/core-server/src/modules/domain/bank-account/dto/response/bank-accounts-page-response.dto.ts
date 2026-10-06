import { ApiProperty } from '@nestjs/swagger';
import { BankAccountDto } from '../entity/bank-account.dto';

export class BankAccountsPageResponseDto {
  @ApiProperty({ type: [BankAccountDto] })
  result: BankAccountDto[];

  @ApiProperty()
  count: number;
}
