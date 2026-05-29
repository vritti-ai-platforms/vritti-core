import { IsOptional, IsUUID } from 'class-validator';
import { SelectOptionsQueryDto } from '@vritti/api-sdk';

export class InventoryItemsSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsUUID()
  excludeOnSupplierId?: string;
}
