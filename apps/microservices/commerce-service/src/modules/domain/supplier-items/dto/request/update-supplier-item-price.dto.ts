import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsDateString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateSupplierItemPriceDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeBuyQty?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeFreeQty?: number | null;

  @IsOptional()
  @IsDateString()
  validTo?: string | null;
}
