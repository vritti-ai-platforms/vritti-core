import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsOptional, IsUUID } from 'class-validator';

export class BulkSiteItemsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsUUID('7', { each: true })
  inventoryItemIds: string[];

  // The legal entity names the site; a site session uses its own
  @IsOptional()
  @IsUUID('7')
  siteId?: string;
}
