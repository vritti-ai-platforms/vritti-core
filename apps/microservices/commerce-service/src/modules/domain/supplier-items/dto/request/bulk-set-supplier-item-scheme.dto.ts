import { ArrayNotEmpty, IsArray, IsBoolean, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class BulkSetSupplierItemSchemeDto {
  @IsUUID('7')
  supplierId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  supplierItemIds: string[];

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeBuyQty?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeFreeQty?: number | null;

  @IsBoolean()
  hasScheme: boolean;
}
