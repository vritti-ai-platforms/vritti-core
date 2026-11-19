import { IsUUID } from 'class-validator';

export class InventoryItemUnitsQueryDto {
  @IsUUID('7')
  inventoryItemId: string;
}
