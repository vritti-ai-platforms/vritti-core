import { IsNumber, IsPositive, IsUUID, Max } from 'class-validator';

export class CreateInventoryItemStorageTypeDto {
  @IsUUID('7')
  inventoryItemId: string;

  @IsUUID('7')
  storageTypeId: string;

  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'Up to 3 decimal places' })
  @IsPositive()
  @Max(999_999_999.999)
  maxQuantity: number;

  @IsUUID('7')
  uomId: string;
}
