import { IsUUID } from 'class-validator';

export class SupplierQuotationSiteRefDto {
  @IsUUID('7')
  quotationId: string;

  @IsUUID('7')
  siteId: string;
}
