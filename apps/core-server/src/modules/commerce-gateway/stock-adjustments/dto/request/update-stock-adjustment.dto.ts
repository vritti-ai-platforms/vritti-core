import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsOptional, IsString } from 'class-validator';

export class UpdateStockAdjustmentDto {
  @ApiPropertyOptional({ description: 'Reason for adjustment' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Opening-stock unit cost (BU currency, per primary UOM).',
  })
  @IsOptional()
  @IsCurrency()
  unitCost?: CurrencyAmountDto;
}
