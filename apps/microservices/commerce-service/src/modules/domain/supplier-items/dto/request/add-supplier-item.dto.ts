import { Trim } from '@vritti/api-sdk/decorators';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class AddSupplierItemDto {
  @IsUUID('7')
  supplierId: string;

  @IsUUID('7')
  inventoryItemId: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierItemCode?: string | null;

  @IsUUID('7')
  @IsNotEmpty()
  uomId: string;

  // The least the supplier sells per order, in the item's unit
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  minOrderQuantity?: number;

  // Days from order to delivery; every site of the item that does not set its own follows it
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  siteIds: string[];
}
