import { UpdateReceiveWithInvoiceDto } from '@domain/purchases/dto/request/update-receive-with-invoice.dto';
import { IsOptional, IsTimeZone } from 'class-validator';

export class LeUpdateReceiveWithInvoiceDto extends UpdateReceiveWithInvoiceDto {
  // The purchase's site timezone, which a purchase order created here is dated in
  @IsOptional()
  @IsTimeZone()
  timezone?: string;
}
