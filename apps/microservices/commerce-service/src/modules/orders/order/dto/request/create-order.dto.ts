import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { OrderSourceValues, PaymentMethodValues } from '@/db/schema';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @IsUUID()
  organizationId: string;

  @IsUUID()
  businessUnitId: string;

  @IsEnum(OrderSourceValues)
  source: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsEnum(PaymentMethodValues)
  paymentMethod: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
