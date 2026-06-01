import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { type FreeSchemeMode, FreeSchemeModeValues } from '@/db/schema';

export class UpdatePurchaseOrderItemDto {
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  uomQty?: number;

  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto;

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
