import { PartialType, PickType } from '@nestjs/swagger';
import { CreatePayoutAccountDto } from './create-payout-account.dto';

// The bank account and gateway are fixed once saved; only the gateway account id can change
export class UpdatePayoutAccountDto extends PartialType(
  PickType(CreatePayoutAccountDto, ['gatewayAccountId'] as const),
) {}
