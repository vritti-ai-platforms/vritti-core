import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { IsOptional, IsUUID } from 'class-validator';

export class InventoryItemQuantsSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;
}
