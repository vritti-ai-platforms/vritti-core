import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';

export class CreatePurchaseOrderItemDto {
  @IsUUID()
  inventoryItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  orderedQuantity: number;
}

export class CreatePurchaseOrderDto {
  @IsUUID()
  supplierId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  poNumber?: string;

  @IsString()
  @IsNotEmpty()
  orderDate: string;

  @IsOptional()
  @IsString()
  expectedDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items?: CreatePurchaseOrderItemDto[];
}
