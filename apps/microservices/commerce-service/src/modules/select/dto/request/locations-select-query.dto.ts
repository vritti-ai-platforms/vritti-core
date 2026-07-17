import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class LocationsSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsString()
  locationRoles?: string;

  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;

  @IsOptional()
  @IsUUID()
  excludeUsedOnGoodsReceiptItemId?: string;

  @IsOptional()
  @IsUUID()
  goodsReceiptLotId?: string;
}
