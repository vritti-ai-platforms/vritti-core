import { IsUUID } from 'class-validator';
import { IsLeSite } from '@/security/validators/is-le-site.validator';

export class SupplierEnrollmentSiteParamsDto {
  @IsUUID('7')
  id: string;

  @IsUUID('7')
  @IsLeSite()
  siteId: string;
}
