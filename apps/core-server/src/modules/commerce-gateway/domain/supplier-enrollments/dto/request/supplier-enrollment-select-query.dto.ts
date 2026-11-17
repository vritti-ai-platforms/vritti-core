import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';
import {
  SUPPLIER_ENROLLMENT_STATUSES,
  type SupplierEnrollmentStatus,
} from '../response/supplier-enrollment-row-response.dto';

export class SupplierEnrollmentSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({
    description: "Only suppliers with this enrollment status at the session's site",
    enum: SUPPLIER_ENROLLMENT_STATUSES,
  })
  @IsOptional()
  @IsIn(SUPPLIER_ENROLLMENT_STATUSES)
  enrollmentStatus?: SupplierEnrollmentStatus;

  @ApiPropertyOptional({
    description: "Only suppliers active supplier-wide whose enrollment at the session's site, if any, is active",
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;

  @ApiPropertyOptional({
    type: [String],
    description:
      "Marks the suppliers the legal entity set up any of these inventory items for (comma-separated); onlySupplying or the site's rules keep only them",
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : String(value).split(',').filter(Boolean)))
  @IsArray()
  @IsUUID('7', { each: true })
  suppliedItemIds?: string[];

  @ApiPropertyOptional({
    description:
      "With suppliedItemIds, only the suppliers that supply the item at the site (the site's rules may already)",
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  onlySupplying?: boolean;

  @ApiPropertyOptional({
    description:
      "Marks, and where the site's rules require it keeps, the suppliers set up for this purchase's items still to allocate",
  })
  @IsOptional()
  @IsUUID('7')
  forPurchaseId?: string;
}
