import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { IsLeSite } from '@/security/validators/is-le-site.validator';
import { CreatePurchaseSupplierInvoiceDto } from './create-purchase-supplier-invoice.dto';

export class LeCreatePurchaseSupplierInvoiceDto extends CreatePurchaseSupplierInvoiceDto {
  @ApiProperty({ description: "The legal entity's site the invoiced goods were received at" })
  @IsUUID('7')
  @IsLeSite()
  siteId: string;
}
