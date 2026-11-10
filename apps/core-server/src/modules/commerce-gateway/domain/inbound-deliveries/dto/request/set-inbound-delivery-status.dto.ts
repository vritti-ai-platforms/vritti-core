import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

const MANUAL_STATUSES = ['IN_TRANSIT', 'ARRIVED', 'CANCELLED'] as const;

export class SetInboundDeliveryStatusDto {
  @ApiProperty({
    description:
      'Status the user moves the delivery to: forward from PLANNED through IN_TRANSIT to ARRIVED, or CANCELLED while no goods receipt names it',
    enum: MANUAL_STATUSES,
  })
  @IsIn(MANUAL_STATUSES)
  status: (typeof MANUAL_STATUSES)[number];
}
