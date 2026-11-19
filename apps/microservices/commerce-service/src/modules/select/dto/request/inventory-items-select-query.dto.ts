import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsUUID } from 'class-validator';
import { StockStatusFilterValues } from '@/db/schema';

export class InventoryItemsSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsUUID('7')
  excludeOnSupplierId?: string;

  // Only the items this site carries, each with its stock and levels there; the gateway has checked it is the user's
  // site or one of the legal entity's sites
  @IsOptional()
  @IsUUID('7')
  atSiteId?: string;

  // Only the items this site does not carry yet; the gateway has checked it is the user's site or one of the legal
  // entity's sites
  @IsOptional()
  @IsUUID('7')
  notAtSiteId?: string;

  // Only the items not on this purchase yet; RLS keeps a purchase the caller cannot see from leaving anything out
  @IsOptional()
  @IsUUID('7')
  notOnPurchaseId?: string;

  // With atSiteId, only the items whose stock there has one of these statuses
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

  // With atSiteId, marks the items this supplier supplies there and leaves out those the site's rules keep from it
  @IsOptional()
  @IsUUID('7')
  supplierId?: string;
}
