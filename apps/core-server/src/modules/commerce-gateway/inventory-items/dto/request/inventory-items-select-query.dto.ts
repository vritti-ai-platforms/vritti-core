import { IsOptional, IsString, IsUUID } from 'class-validator';
import { SelectOptionsQueryDto } from '@vritti/api-sdk';

export class InventoryItemsSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsUUID()
  excludeForSupplierId?: string;

  @IsOptional()
  @IsString()
  poId?: string;
}
