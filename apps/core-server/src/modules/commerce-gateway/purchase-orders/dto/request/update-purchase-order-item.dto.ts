import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { IsBoolean, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdatePurchaseOrderItemDto {
  @ApiPropertyOptional({ description: 'Inventory item ID' })
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;

  @ApiPropertyOptional({ description: 'Ordered uomQty', example: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  uomQty?: number;

  @ApiPropertyOptional({ type: CurrencyAmountDto, description: 'Unit price in PO/supplier currency' })
  @IsOptional()
  @IsCurrency()
  unitPrice?: CurrencyAmountDto;

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
}
