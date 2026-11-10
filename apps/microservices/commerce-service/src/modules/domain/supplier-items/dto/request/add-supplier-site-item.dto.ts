import { IsBoolean, IsInt, IsOptional, IsUUID, Max, Min, ValidateIf } from 'class-validator';

export class AddSupplierSiteItemDto {
  @IsUUID('7')
  supplierItemId: string;

  @IsUUID('7')
  siteId: string;

  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;

  // The site's own lead time; omitted, the site follows the supplier item's default
  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(365)
  leadTimeDays?: number;
}
