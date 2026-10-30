import { PickType } from '@nestjs/swagger';
import { CreatePayoutChannelDto } from './create-payout-channel.dto';

export class UpdatePayoutChannelDto extends PickType(CreatePayoutChannelDto, ['bankAccountId'] as const) {}
