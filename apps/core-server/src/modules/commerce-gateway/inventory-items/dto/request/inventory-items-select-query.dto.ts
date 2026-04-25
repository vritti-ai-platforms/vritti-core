import { IsOptional, IsString } from 'class-validator';
import { SelectOptionsQueryDto } from '@vritti/api-sdk';

export class InventoryItemsSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  poId?: string;
}
