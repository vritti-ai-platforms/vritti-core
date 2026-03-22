import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderItemStatusValues } from '../../../commerce-enums';

export class UpdateItemStatusDto {
  @ApiProperty({ enum: Object.values(OrderItemStatusValues) })
  @IsEnum(OrderItemStatusValues)
  status: string;
}
