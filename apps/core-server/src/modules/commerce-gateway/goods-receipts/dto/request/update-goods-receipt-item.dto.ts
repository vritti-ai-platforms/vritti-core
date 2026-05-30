import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class UpdateGoodsReceiptItemDto {
  @ApiPropertyOptional({ description: 'Operator-declared accepted quantity for this item, in the item UOM.' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;

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
}
