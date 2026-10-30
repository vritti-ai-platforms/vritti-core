import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class AddSupplierItemPriceDto {
  @IsUUID('7')
  supplierItemId: string;

  @IsCurrency()
  unitPrice: CurrencyAmountDto;

  @IsOptional()
  @IsUUID('7')
  mrpId?: string | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeBuyQty?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeFreeQty?: number | null;

  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean;

  @IsDateString()
  validFrom: string;

  @IsOptional()
  @IsDateString()
  validTo?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
