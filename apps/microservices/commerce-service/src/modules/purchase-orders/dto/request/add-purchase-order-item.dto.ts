import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { type FreeSchemeMode, FreeSchemeModeValues } from '@/db/schema';

export class AddPurchaseOrderItemDto {
  @IsUUID()
  supplierItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  uomQty: number;

  @IsCurrency()
  unitPrice: CurrencyAmountDto;

  // Free-goods scheme override; prefilled from the supplier item, editable at PO creation.
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeBuyQty?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeFreeQty?: number;

  @IsOptional()
  @IsEnum(FreeSchemeModeValues)
  schemeMode?: FreeSchemeMode;
}
