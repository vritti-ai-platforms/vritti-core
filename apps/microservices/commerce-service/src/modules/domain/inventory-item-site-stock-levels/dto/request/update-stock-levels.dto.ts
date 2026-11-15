import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateStockLevelsDto {
  @IsUUID('7')
  inventoryItemId: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  reorderPoint?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  safetyStock?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  maxStockLevel?: number;
}
