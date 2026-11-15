import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdatePurchaseOrderStatusDto {
  @ApiProperty({
    description:
      'Next status in the manual workflow: DRAFT → SENT or CANCELLED, SENT → CONFIRMED or CANCELLED, CONFIRMED → CANCELLED (until anything is received). Delivery completion goes through complete-delivery.',
    enum: ['SENT', 'CONFIRMED', 'CANCELLED'],
  })
  @IsIn(['SENT', 'CONFIRMED', 'CANCELLED'])
  status: 'SENT' | 'CONFIRMED' | 'CANCELLED';
}
