import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID } from 'class-validator';

export class InventoryItemQuantsSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsUUID('7')
  inventoryItemId?: string;
}
