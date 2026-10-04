import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateSupplierItemSiteDto {
  @IsUUID('7')
  id: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderQuantity?: number | null;
}
