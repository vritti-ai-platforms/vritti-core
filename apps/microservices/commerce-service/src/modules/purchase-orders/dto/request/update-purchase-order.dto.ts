import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import type { PurchaseOrderStatus } from '@/db/schema';

export class UpdatePurchaseOrderItemDto {
  @IsUUID()
  inventoryItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  orderedQuantity: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice?: number | null;
}

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsEnum(['DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'])
  status?: PurchaseOrderStatus;

  @IsOptional()
  @IsString()
  orderDate?: string;

  @IsOptional()
  @IsString()
  expectedDate?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  totalAmount?: number | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePurchaseOrderItemDto)
  items?: UpdatePurchaseOrderItemDto[];
}
