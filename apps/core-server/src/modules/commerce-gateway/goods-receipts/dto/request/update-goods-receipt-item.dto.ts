import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsBoolean, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class UpdateGoodsReceiptItemDto {
  @ApiPropertyOptional({
    description: 'Ordered (paid) quantity for this item, in the item UOM. Free qty is derived from the scheme.',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  orderedQty?: number;

  @ApiPropertyOptional({ description: 'Damage-on-arrival quantity (does not go to inventory).' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQuantity?: number;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Updated supplier unit price. Service recomputes primary_uom_unit_price on save.',
  })
  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto;

  @ApiPropertyOptional({ description: 'Free-goods scheme buy qty (e.g. 9 in "9+1").' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  schemeBuyQty?: number;

  @ApiPropertyOptional({ description: 'Free-goods scheme free qty (e.g. 1 in "9+1").' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  schemeFreeQty?: number;

  @ApiPropertyOptional({ description: 'Whether a free-goods scheme applies.' })
  @IsOptional()
  @IsBoolean()
  hasScheme?: boolean;
}
