import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemModifierDto {
  @IsString()
  @IsNotEmpty()
  modifierGroupId: string;

  @IsString()
  @IsNotEmpty()
  modifierOptionId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsNumber()
  @Min(0)
  additionalPrice: number;
}

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemModifierDto)
  modifiers?: CreateOrderItemModifierDto[];
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  channel: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  customerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  customerPhone?: string;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  serviceCharge?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryCharge?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
