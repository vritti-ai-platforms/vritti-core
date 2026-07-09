import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

  @ApiProperty({ description: 'Reason for adjustment' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Opening-stock unit cost (BU currency, per primary UOM). Required for OPENING_STOCK.',
  })
  @IsOptional()
  @IsCurrency()
  unitCost?: CurrencyAmountDto;
}
