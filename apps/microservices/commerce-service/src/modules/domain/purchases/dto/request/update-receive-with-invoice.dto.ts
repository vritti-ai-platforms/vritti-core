import { IsUUID } from 'class-validator';
import { ReceiveWithInvoiceDto } from './receive-with-invoice.dto';

export class UpdateReceiveWithInvoiceDto extends ReceiveWithInvoiceDto {
  @IsUUID('7')
  invoiceId: string;
}
