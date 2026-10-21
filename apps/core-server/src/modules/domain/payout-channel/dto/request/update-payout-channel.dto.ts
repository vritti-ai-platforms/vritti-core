import { PickType } from '@nestjs/swagger';
import { CreatePayoutChannelDto } from './create-payout-channel.dto';

// A channel's scope is fixed; it can be pointed at another payout account of the same legal entity
export class UpdatePayoutChannelDto extends PickType(CreatePayoutChannelDto, ['payoutAccountId'] as const) {}
