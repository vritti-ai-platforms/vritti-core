import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateSupplierItemPriceDto {
  @IsUUID('7')
  id: string;

  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto;

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

  @IsOptional()
  @IsDateString()
  validTo?: string | null;
}
