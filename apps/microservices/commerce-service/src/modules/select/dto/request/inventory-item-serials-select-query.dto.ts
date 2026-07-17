import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { IsOptional, IsUUID } from 'class-validator';

export class InventoryItemSerialsSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsUUID()
  quantId?: string;
}
