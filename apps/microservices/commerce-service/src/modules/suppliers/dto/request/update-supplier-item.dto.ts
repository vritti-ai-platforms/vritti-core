import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class UpdateSupplierItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierItemCode?: string | null;

  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto | null;

  @IsOptional()
  @IsUUID()
  uomId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderQuantity?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number | null;

  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
