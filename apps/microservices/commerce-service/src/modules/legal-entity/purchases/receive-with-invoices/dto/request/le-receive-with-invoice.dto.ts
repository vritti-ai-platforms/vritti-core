import { ReceiveWithInvoiceDto } from '@domain/purchases/dto/request/receive-with-invoice.dto';
import { IsUUID } from 'class-validator';

export class LeReceiveWithInvoiceDto extends ReceiveWithInvoiceDto {
  @IsUUID('7')
  siteId: string;
}
