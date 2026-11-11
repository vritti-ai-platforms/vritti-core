import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Target order status',
    example: 'ACCEPTED',
    enum: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'],
  })
  @IsString()
  @IsNotEmpty()
  status: string;
}
