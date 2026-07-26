import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateStockAdjustmentDto {
  @ApiProperty({ description: 'Inventory item ID' })
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @ApiProperty({ description: 'Adjustment type', example: 'WASTE' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Reason for adjustment' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Opening-stock unit cost (site currency, per primary UOM). Required for OPENING_STOCK.',
  })
  @IsOptional()
  @IsCurrency()
  unitCost?: CurrencyAmountDto;
}
