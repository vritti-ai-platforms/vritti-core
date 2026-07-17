import { ArrayNotEmpty, IsArray, IsBoolean, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class BulkSetSupplierItemSchemeDto {
  @IsUUID()
  supplierId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
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
