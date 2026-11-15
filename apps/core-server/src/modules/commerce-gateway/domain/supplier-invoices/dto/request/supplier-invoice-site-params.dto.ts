import { IsUUID } from 'class-validator';
import { IsLeSite } from '@/security/validators/is-le-site.validator';

export class SupplierInvoiceSiteParamsDto {
  @IsUUID('7')
  @IsLeSite()
  siteId: string;
}
