import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateSupplierItemSiteDto {
  @IsUUID('7')
  id: string;

  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;

  // Pins a lead time to this site
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number | null;

  // Drops the site's own lead time and follows the supplier item's again
  @IsOptional()
  @IsBoolean()
  followItemLeadTime?: boolean;
}
