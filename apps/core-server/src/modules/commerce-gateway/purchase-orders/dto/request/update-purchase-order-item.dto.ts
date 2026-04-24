import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdatePurchaseOrderItemDto {
  @ApiPropertyOptional({ description: 'Inventory item ID' })
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;

  @ApiPropertyOptional({ description: 'Ordered quantity', example: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  orderedQuantity?: number;

  @ApiPropertyOptional({ type: CurrencyAmountDto })
  @IsOptional()
  @IsCurrency()
  supplierUnitPrice?: CurrencyAmountDto;

  @ApiPropertyOptional({ type: CurrencyAmountDto })
  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto;
}
