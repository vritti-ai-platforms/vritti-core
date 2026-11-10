import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class SupplierEnrolledSitesQueryDto {
  @ValidateIf((query: SupplierEnrolledSitesQueryDto) => !query.inventoryItemId)
  @IsUUID('7')
  supplierId?: string;

  @ValidateIf((query: SupplierEnrolledSitesQueryDto) => !query.supplierId)
  @IsUUID('7')
  inventoryItemId?: string;

  // Only the sites where the enrollment and the supplier are both active
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
