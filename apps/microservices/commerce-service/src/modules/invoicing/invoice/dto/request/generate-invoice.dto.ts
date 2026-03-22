import { IsUUID } from 'class-validator';

export class GenerateInvoiceDto {
  @IsUUID()
  orderId: string;
}
