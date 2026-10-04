import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class LocationsSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsString()
  locationRoles?: string;

  @IsOptional()
  @IsUUID('7')
  inventoryItemId?: string;

  @IsOptional()
  @IsUUID('7')
  excludeUsedOnGoodsReceiptItemId?: string;

  @IsOptional()
  @IsUUID('7')
  goodsReceiptLotId?: string;
}
