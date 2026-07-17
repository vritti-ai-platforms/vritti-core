import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { IsOptional, IsUUID } from 'class-validator';

export class InventoryItemLotsSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;
}
