import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

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

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeBuyQty?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeFreeQty?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasScheme?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean;
}
