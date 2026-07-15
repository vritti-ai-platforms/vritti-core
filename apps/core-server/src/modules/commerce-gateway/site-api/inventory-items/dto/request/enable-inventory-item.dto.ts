import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class EnableInventoryItemDto {
  @ApiProperty({ description: 'Master inventory item to enable at the current site' })
  @IsUUID()
  inventoryItemId: string;

  @ApiPropertyOptional({ description: 'Reorder point in the base UOM' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  reorderPoint?: number;

  @ApiPropertyOptional({ description: 'Maximum stock level in the base UOM' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  maxStockLevel?: number;

  @ApiPropertyOptional({ description: 'Safety stock in the base UOM' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  safetyStock?: number;
}
