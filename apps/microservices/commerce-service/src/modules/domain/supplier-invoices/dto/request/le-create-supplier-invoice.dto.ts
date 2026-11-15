import { IsUUID } from 'class-validator';
import { CreateSupplierInvoiceDto } from './create-supplier-invoice.dto';

export class LeCreateSupplierInvoiceDto extends CreateSupplierInvoiceDto {
  @IsUUID('7')
  siteId: string;
}
