import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class AddInventoryItemLocationDto {
  @IsUUID('7')
  inventoryItemId: string;

  @IsUUID('7')
  locationId: string;

  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;
}
