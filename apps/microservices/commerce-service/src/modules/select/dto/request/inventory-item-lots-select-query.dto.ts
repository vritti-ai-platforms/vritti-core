import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID } from 'class-validator';

export class InventoryItemLotsSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;
}
