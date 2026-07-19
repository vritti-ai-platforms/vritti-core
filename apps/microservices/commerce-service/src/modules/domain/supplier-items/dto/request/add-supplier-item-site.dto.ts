import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class AddSupplierItemSiteDto {
  @IsUUID()
  supplierItemId: string;

  @IsUUID()
  siteId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderQuantity?: number | null;
}
