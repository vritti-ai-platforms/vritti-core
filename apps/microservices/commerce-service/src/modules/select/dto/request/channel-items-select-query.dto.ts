import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { IsUUID } from 'class-validator';

// What a storefront sells only means anything next to the channel selling it, so the channel is required
export class ChannelItemsSelectQueryDto extends SelectOptionsQueryDto {
  @IsUUID()
  channelId: string;
}
