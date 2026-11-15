import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { IsLeSite } from '@/security/validators/is-le-site.validator';
import { CreateSupplierInvoiceDto } from './create-supplier-invoice.dto';

export class LeCreateSupplierInvoiceDto extends CreateSupplierInvoiceDto {
  @ApiProperty({ description: 'Supplier the invoice is from' })
  @IsUUID('7')
  supplierId: string;

  @ApiProperty({ description: "One of the legal entity's sites; the stock invoiced was received there" })
  @IsUUID('7')
  @IsLeSite()
  siteId: string;
}
