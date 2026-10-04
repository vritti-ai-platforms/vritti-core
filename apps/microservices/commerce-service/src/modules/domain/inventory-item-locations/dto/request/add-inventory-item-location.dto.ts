import { IsNumber, IsUUID, Min } from 'class-validator';

export class AddInventoryItemLocationDto {
  @IsUUID('7')
  inventoryItemId: string;

  @IsUUID('7')
  locationId: string;

  @IsNumber()
  @Min(0)
  reorderLevel: number;
}
