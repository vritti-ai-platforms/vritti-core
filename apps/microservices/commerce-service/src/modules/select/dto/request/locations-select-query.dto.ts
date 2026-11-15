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

  // Only this site's locations; the gateway has checked it is one of the legal entity's sites
  @IsOptional()
  @IsUUID('7')
  atSiteId?: string;
}
