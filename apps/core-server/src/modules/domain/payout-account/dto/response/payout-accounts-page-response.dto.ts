import { ApiProperty } from '@nestjs/swagger';
import { PayoutAccountDto } from '../entity/payout-account.dto';

export class PayoutAccountsPageResponseDto {
  @ApiProperty({ type: [PayoutAccountDto] })
  result: PayoutAccountDto[];

  @ApiProperty()
  count: number;
}
