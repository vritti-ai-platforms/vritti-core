import { ApiProperty } from '@nestjs/swagger';

export class InboundDeliveryCountsResponseDto {
  @ApiProperty({ description: 'Purchase order lines on the delivery', example: 5 })
  lineCount: number;
}
