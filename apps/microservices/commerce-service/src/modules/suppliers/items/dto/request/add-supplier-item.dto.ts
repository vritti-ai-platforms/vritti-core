import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { type FreeSchemeMode, FreeSchemeModeValues } from '@/db/schema';

export class AddSupplierItemDto {
  @IsUUID()
  inventoryItemId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierItemCode?: string;

  @IsCurrency()
  unitPrice: CurrencyAmountDto;

  @IsUUID()
  @IsNotEmpty()
  uomId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;

  // Standing free-goods scheme (e.g. buy 9 get 1). Prefills PO/GR lines for this supplier item.
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
