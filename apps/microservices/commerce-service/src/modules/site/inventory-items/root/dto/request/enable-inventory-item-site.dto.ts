import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class EnableInventoryItemSiteDto {
  @IsUUID()
  inventoryItemId: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  reorderPoint?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  maxStockLevel?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  safetyStock?: number;
}
