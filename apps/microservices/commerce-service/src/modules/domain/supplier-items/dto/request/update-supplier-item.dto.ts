import { Trim } from '@vritti/api-sdk/decorators';
import { IsInt, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class UpdateSupplierItemDto {
  @IsUUID('7')
  supplierId: string;

  @IsUUID('7')
  supplierItemId: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierItemCode?: string | null;

  @IsOptional()
  @IsUUID('7')
  uomId?: string;

  // The least the supplier sells per order, in the item's unit
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  minOrderQuantity?: number | null;

  // Days from order to delivery; every site of the item that does not set its own follows it
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number | null;
}
