import { ArrayNotEmpty, IsArray, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class BulkSetSupplierItemMinOrderDto {
  @IsUUID('7')
  supplierId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  supplierItemIds: string[];

  // The least the supplier sells per order, in each item's own unit; null clears it
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  minOrderQuantity: number | null;
}
