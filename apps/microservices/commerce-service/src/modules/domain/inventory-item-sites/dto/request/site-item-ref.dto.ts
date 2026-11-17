import { IsOptional, IsUUID } from 'class-validator';

export class SiteItemRefDto {
  @IsUUID('7')
  inventoryItemId: string;

  // The legal entity names the site; a site session uses its own
  @IsOptional()
  @IsUUID('7')
  siteId?: string;
}
