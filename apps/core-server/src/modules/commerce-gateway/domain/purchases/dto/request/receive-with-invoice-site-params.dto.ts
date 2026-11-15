import { IsUUID } from 'class-validator';
import { IsLeSite } from '@/security/validators/is-le-site.validator';

export class ReceiveWithInvoiceSiteParamsDto {
  @IsUUID('7')
  @IsLeSite()
  siteId: string;
}
