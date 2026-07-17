import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsOptional, IsString } from 'class-validator';

export class UpdateStockAdjustmentDto {
  @Trim()
  @ApiPropertyOptional({ description: 'Reason for adjustment' })
  @IsOptional()
  @IsString()
  reason?: string | null;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Opening-stock unit cost (site currency, per primary UOM).',
  })
  @IsOptional()
  @IsCurrency()
  unitCost?: CurrencyAmountDto;
}
