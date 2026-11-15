import { IsUUID } from 'class-validator';

export class ReceiveWithInvoiceRefDto {
  @IsUUID('7')
  invoiceId: string;
}
