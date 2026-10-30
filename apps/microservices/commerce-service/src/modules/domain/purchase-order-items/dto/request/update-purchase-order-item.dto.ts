import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsBoolean, IsNumber, IsOptional, IsPositive, IsUUID, Min } from 'class-validator';

export class UpdatePurchaseOrderItemDto {
  @IsUUID('7')
  id: string;

  @IsUUID('7')
  itemId: string;

  @IsOptional()
  @IsUUID('7')
  inventoryItemId?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  uomQty?: number;

  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto;

  // 1 unit of the price's currency in the PO currency, when the price is quoted in another of the supplier's
  // currencies; once given it applies to every line of the PO in that currency
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  conversionRate?: number;

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
}
