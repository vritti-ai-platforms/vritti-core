import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';
import { type SupplierEnrollmentStatus, SupplierEnrollmentStatusValues } from '../entity/supplier-enrollment-row.dto';

export class SupplierEnrollmentSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsIn(Object.values(SupplierEnrollmentStatusValues))
  enrollmentStatus?: SupplierEnrollmentStatus;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;
  // Marks the suppliers the legal entity set up any of these items for (comma-separated); onlySupplying or the site's
  // rules keep only them
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : String(value).split(',').filter(Boolean)))
  @IsArray()
  @IsUUID('7', { each: true })
  suppliedItemIds?: string[];

  // With suppliedItemIds, keeps only the suppliers the legal entity set up any of the items for, as the site's rules may already
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  onlySupplying?: boolean;

  // Marks, and where the site's rules require it keeps, the suppliers set up for this purchase's items still to allocate
  @IsOptional()
  @IsUUID('7')
  forPurchaseId?: string;
}
