import {
  type SiteEnrollmentStatus,
  SiteEnrollmentStatusValues,
} from '@domain/suppliers/dto/entity/site-supplier-list-row.dto';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class SuppliersSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsUUID('7')
  siteId?: string;

  @IsOptional()
  @IsIn(Object.values(SiteEnrollmentStatusValues))
  enrollmentStatus?: SiteEnrollmentStatus;
}
