import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsUUID } from 'class-validator';
import { StockStatusFilterValues } from '@/db/schema';

export class InventoryItemsSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsUUID('7')
  excludeOnSupplierId?: string;

  // Only the items with stock levels set at this site, each with its stock and levels there; the gateway has checked it
  // is the user's site or one of the legal entity's sites
  @IsOptional()
  @IsUUID('7')
  stockLevelsAtSiteId?: string;

  // With stockLevelsAtSiteId, only the items whose stock there has one of these statuses
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : String(value).split(',').filter(Boolean)))
  @IsArray()
  @IsIn(Object.values(StockStatusFilterValues), { each: true })
  stockStatus?: string[];

  // Only the items filed under one of these categories
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : String(value).split(',').filter(Boolean)))
  @IsArray()
  @IsUUID('7', { each: true })
  categoryIds?: string[];
}
