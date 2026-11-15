import { CreatePurchaseSupplierInvoiceDto } from '@domain/purchases/dto/request/create-purchase-supplier-invoice.dto';
import { IsUUID } from 'class-validator';

export class LeCreatePurchaseSupplierInvoiceDto extends CreatePurchaseSupplierInvoiceDto {
  @IsUUID('7')
  siteId: string;
}
