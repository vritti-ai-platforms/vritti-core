import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsBoolean, IsNumber, IsOptional, IsPositive, IsUUID, Min } from 'class-validator';

export class AddPurchaseOrderItemDto {
  @ApiProperty({ description: 'Supplier item ID' })
  @IsUUID('7')
  supplierItemId: string;

  @ApiProperty({ description: 'Ordered uomQty', example: 100 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  uomQty: number;

  @ApiProperty({
    type: CurrencyAmountDto,
    description:
      "Unit price in the PO currency, or in the supplier item's own currency to be converted at the PO's rate for it",
  })
  @IsCurrency()
  unitPrice: CurrencyAmountDto;

  @ApiPropertyOptional({
    description:
      "1 unit of the supplier item's currency in the PO currency, when unitPrice is in the item's currency and no rate is stored on the PO for it yet; once given it applies to every line in that currency",
    example: 83.25,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  conversionRate?: number;

  @ApiPropertyOptional({
    description: 'Free-goods scheme buy qty (e.g. 9 in "9+1"). Prefilled from the supplier item.',
  })
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
}
