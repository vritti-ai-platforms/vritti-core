import { ApiProperty } from '@nestjs/swagger';
import { PurchaseEventResponseDto } from './purchase-event-response.dto';

export class PurchaseEventsPageResponseDto {
  @ApiProperty({ type: [PurchaseEventResponseDto], description: 'Events, newest first' })
  result: PurchaseEventResponseDto[];

  @ApiProperty({ description: 'Events matching the filter' })
  count: number;
}
