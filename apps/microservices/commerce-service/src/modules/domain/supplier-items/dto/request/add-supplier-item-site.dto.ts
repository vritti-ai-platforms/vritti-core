import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class AddSupplierItemSiteDto {
  @IsUUID('7')
  supplierItemId: string;

  @IsUUID('7')
  siteId: string;

  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number | null;
}
