import { IsBoolean, IsInt, IsOptional, IsUUID, Max, Min, ValidateIf } from 'class-validator';

export class UpdateSupplierSiteItemDto {
  @IsUUID('7')
  id: string;

  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;

  // Pins a lead time to this site
  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(365)
  leadTimeDays?: number;

  // Drops the site's own lead time and follows the supplier item's default again
  @IsOptional()
  @IsBoolean()
  followDefaultLeadTime?: boolean;
}
