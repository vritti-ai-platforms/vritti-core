import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class AddPurchaseOrderItemDto {
  @ApiProperty({ description: 'Inventory item ID' })
  @IsUUID()
  inventoryItemId: string;

  @ApiProperty({ description: 'Ordered quantity', example: 100 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantity: number;

  @ApiProperty({ type: CurrencyAmountDto })
  @IsCurrency()
  supplierUnitPrice: CurrencyAmountDto;

  @ApiPropertyOptional({ type: CurrencyAmountDto })
  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto;
}
