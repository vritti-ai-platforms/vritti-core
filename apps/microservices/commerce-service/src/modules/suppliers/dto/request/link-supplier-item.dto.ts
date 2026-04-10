import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class LinkSupplierItemDto {
  @IsUUID()
  inventoryItemId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierCode?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsUUID()
  uomId?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  minOrderQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;
}
