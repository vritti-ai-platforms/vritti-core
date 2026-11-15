import { IsNumber, IsOptional, IsPositive, IsUUID, Max } from 'class-validator';

export class UpdateInventoryItemStorageTypeDto {
  @IsUUID('7')
  inventoryItemId: string;

  @IsUUID('7')
  id: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'Up to 3 decimal places' })
  @IsPositive()
  @Max(999_999_999.999)
  maxQuantity?: number;

  @IsOptional()
  @IsUUID('7')
  uomId?: string;
}
