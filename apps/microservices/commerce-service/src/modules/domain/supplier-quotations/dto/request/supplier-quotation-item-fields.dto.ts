import { Trim } from '@vritti/api-sdk/decorators';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class SupplierQuotationItemFieldsDto {
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierItemCode?: string | null;

  @IsCurrency()
  unitPrice: CurrencyAmountDto;

  // MRP printed on the pack in the line's unit; recorded on the item's MRPs when it is new
  @IsOptional()
  @IsCurrency()
  mrp?: CurrencyAmountDto | null;

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
}
