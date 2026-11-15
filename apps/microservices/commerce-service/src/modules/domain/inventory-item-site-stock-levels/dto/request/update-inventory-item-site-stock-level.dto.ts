import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateInventoryItemSiteStockLevelDto {
  @IsUUID('7')
  inventoryItemId: string;

  @IsUUID('7')
  siteId: string;

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
