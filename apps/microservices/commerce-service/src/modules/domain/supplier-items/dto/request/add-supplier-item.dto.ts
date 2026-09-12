import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class AddSupplierItemDto {
  @IsUUID()
  supplierId: string;

  @IsUUID()
  inventoryItemId: string;

  // How this supplier's invoice classifies the goods — the same item can be goods from one supplier
  // and job work from another. Required: there is no fallback to the item or its category.
  @IsUUID()
  taxClassId: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierItemCode?: string | null;

  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto | null;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasScheme?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean;
}
