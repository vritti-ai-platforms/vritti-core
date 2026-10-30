import {
  SITE_ENROLLMENT_STATUSES,
  type SiteEnrollmentStatus,
} from '@commerce/supplier-sites/dto/response/site-supplier-list-row-response.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class SuppliersSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({
    description: 'Site whose enrollment status each option carries (as the `enrollmentStatus` additional)',
  })
  @IsOptional()
  @IsUUID('7')
  siteId?: string;

  @ApiPropertyOptional({
    description: 'Only suppliers with this enrollment status at `siteId`',
    enum: SITE_ENROLLMENT_STATUSES,
  })
  @IsOptional()
  @IsIn(SITE_ENROLLMENT_STATUSES)
  enrollmentStatus?: SiteEnrollmentStatus;
}
