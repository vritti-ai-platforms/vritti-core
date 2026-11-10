import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class UpdateInboundDeliveryLineDto {
  @ApiProperty({
    description:
      'New quantity in the PO line unit; not below what is received against the delivery, nor above what the line has left',
    example: 8,
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantity: number;
}
