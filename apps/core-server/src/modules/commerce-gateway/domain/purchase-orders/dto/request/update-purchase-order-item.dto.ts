import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsPositive, IsUUID, Matches, Min } from 'class-validator';

export class UpdatePurchaseOrderItemDto {
  @ApiPropertyOptional({ description: 'Inventory item ID' })
  @IsOptional()
  @IsUUID('7')
  inventoryItemId?: string;

  @ApiPropertyOptional({ description: 'Ordered uomQty', example: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  uomQty?: number;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description:
      "Unit price in the PO currency, or in the supplier item's own currency to be converted at the PO's rate for it",
  })
  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto;

  @ApiPropertyOptional({
    description:
      "1 unit of the supplier item's currency in the PO currency, when unitPrice is in the item's currency and no rate is stored on the PO for it yet; once given it applies to every line in that currency",
    example: 83.25,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  conversionRate?: number;

  @ApiPropertyOptional({ description: 'Free-goods scheme buy qty (e.g. 9 in "9+1").' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeBuyQty?: number;

  @ApiPropertyOptional({ description: 'Free-goods scheme free qty (e.g. 1 in "9+1").' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  schemeFreeQty?: number;

  @ApiPropertyOptional({ description: 'Whether a free-goods scheme applies.' })
  @IsOptional()
  @IsBoolean()
  hasScheme?: boolean;

  @ApiPropertyOptional({
    description:
      'Date the line is expected to be delivered (YYYY-MM-DD), on or after the order date; rejected while the line is on an inbound delivery',
    example: '2026-04-25',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'expectedDeliveryDate must be YYYY-MM-DD' })
  expectedDeliveryDate?: string;

  @ApiPropertyOptional({
    description: "The line's own tax date (YYYY-MM-DD); the line stops following the purchase order's",
    example: '2026-04-10',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'taxDate must be YYYY-MM-DD' })
  taxDate?: string;

  @ApiPropertyOptional({
    description: "True to make the line follow the purchase order's tax date again; not together with taxDate",
  })
  @IsOptional()
  @IsBoolean()
  followPoTaxDate?: boolean;
}
