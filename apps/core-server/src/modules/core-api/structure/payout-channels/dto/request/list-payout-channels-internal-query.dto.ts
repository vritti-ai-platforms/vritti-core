import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ListPayoutChannelsInternalQueryDto {
  @ApiProperty({ description: 'The legal entity whose payout channels, its sites included, are listed' })
  @IsUUID()
  legalEntityId: string;
}
