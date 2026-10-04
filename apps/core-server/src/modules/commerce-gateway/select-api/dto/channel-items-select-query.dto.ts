import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID } from 'class-validator';

// Optional: a caller that knows which channel it means names one, and everyone else gets the channel
// their own workspace sells through, resolved server-side. A browser should not have to hold a
// channel id to ask what this shop sells.
export class ChannelItemsSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({ description: "The APP catalog channel whose range to list; defaults to the caller's" })
  @IsOptional()
  @IsUUID('7')
  channelId?: string;
}
