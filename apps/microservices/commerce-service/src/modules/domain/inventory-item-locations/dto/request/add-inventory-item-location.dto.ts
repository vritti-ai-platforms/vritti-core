import { IsNumber, IsUUID, Min } from 'class-validator';

export class AddInventoryItemLocationDto {
  @IsUUID()
  inventoryItemId: string;

  @IsUUID()
  locationId: string;

  @IsNumber()
  @Min(0)
  reorderLevel: number;
}
