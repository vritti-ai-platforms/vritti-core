import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';

export class CreateOrderItemModifierDto {
  @ApiProperty({ description: 'Modifier group ID' })
  @IsString()
  @IsNotEmpty()
  modifierGroupId: string;

  @ApiProperty({ description: 'Modifier option ID' })
  @IsString()
  @IsNotEmpty()
  modifierOptionId: string;

  @ApiProperty({ description: 'Modifier display name', example: 'Extra Cheese' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Additional price for this modifier', example: 30 })
  @IsNumber()
  @Min(0)
  additionalPrice: number;
}

export class CreateOrderItemDto {
  @ApiProperty({ description: 'Item variant ID' })
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({ description: 'Quantity ordered', example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Special instructions for this item' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Modifier selections', type: [CreateOrderItemModifierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemModifierDto)
  modifiers?: CreateOrderItemModifierDto[];
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Order type', example: 'DINE_IN', enum: ['DINE_IN', 'TAKEAWAY', 'DELIVERY'] })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Order channel', example: 'WALK_IN', enum: ['ONLINE', 'WALK_IN'] })
  @IsString()
  @IsNotEmpty()
  channel: string;

  @ApiPropertyOptional({ description: 'Customer ID (links the order to an existing customer record)' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Customer name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  customerName?: string;

  @ApiPropertyOptional({ description: 'Customer phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  customerPhone?: string;

  @ApiPropertyOptional({ description: 'Delivery address (required for DELIVERY type)' })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiPropertyOptional({ description: 'Order notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Service charge amount', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  serviceCharge?: number;

  @ApiPropertyOptional({ description: 'Delivery charge amount', example: 40 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryCharge?: number;

  @ApiPropertyOptional({ description: 'Discount amount', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiProperty({ description: 'Order line items', type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
