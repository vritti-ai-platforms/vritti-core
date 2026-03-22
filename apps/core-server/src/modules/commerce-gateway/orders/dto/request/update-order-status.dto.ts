import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatusValues } from '../../../commerce-enums';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: Object.values(OrderStatusValues) })
  @IsEnum(OrderStatusValues)
  status: string;
}
