import { ReceiveWithInvoiceOpenLinesQueryDto } from '@domain/purchases/dto/request/receive-with-invoice-open-lines-query.dto';
import { IsUUID } from 'class-validator';

export class LeReceiveWithInvoiceOpenLinesQueryDto extends ReceiveWithInvoiceOpenLinesQueryDto {
  @IsUUID('7')
  siteId: string;
}
