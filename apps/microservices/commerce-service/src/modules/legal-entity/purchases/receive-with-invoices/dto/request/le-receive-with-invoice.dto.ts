import { ReceiveWithInvoiceDto } from '@domain/purchases/dto/request/receive-with-invoice.dto';
import { IsOptional, IsTimeZone, IsUUID } from 'class-validator';

export class LeReceiveWithInvoiceDto extends ReceiveWithInvoiceDto {
  @IsUUID('7')
  siteId: string;

  // The purchase's site timezone, which a purchase order created here is dated in
  @IsOptional()
  @IsTimeZone()
  timezone?: string;
}
