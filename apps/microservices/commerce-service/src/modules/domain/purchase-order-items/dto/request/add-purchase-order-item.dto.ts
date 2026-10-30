import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsBoolean, IsNumber, IsOptional, IsPositive, IsUUID, Min } from 'class-validator';

export class AddPurchaseOrderItemDto {
  @IsUUID('7')
  id: string;

  @IsUUID('7')
  supplierItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  uomQty: number;

  @IsCurrency()
  unitPrice: CurrencyAmountDto;

  // 1 unit of the price's currency in the PO currency, when the price is quoted in another of the supplier's
  // currencies; once given it applies to every line of the PO in that currency
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  conversionRate?: number;

  // Free-goods scheme override; prefilled from the supplier item, editable at PO creation.
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
