import { IsUUID } from 'class-validator';
import { IsLeSite } from '@/security/validators/is-le-site.validator';

export class SupplierQuotationSiteParamsDto {
  @IsUUID('7')
  quotationId: string;

  @IsUUID('7')
  @IsLeSite()
  siteId: string;
}
