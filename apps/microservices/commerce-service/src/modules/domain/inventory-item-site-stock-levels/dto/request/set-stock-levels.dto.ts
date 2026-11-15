import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class SetStockLevelsDto {
  @IsUUID('7')
  inventoryItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  reorderPoint: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  safetyStock?: number;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  maxStockLevel: number;
}
