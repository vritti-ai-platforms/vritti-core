import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { OrderSourceValues, PaymentMethodValues } from '../../../commerce-enums';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ApiProperty()
  @IsUUID()
  businessUnitId: string;

  @ApiProperty({ enum: Object.values(OrderSourceValues) })
  @IsEnum(OrderSourceValues)
  source: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ enum: Object.values(PaymentMethodValues) })
  @IsEnum(PaymentMethodValues)
  paymentMethod: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
