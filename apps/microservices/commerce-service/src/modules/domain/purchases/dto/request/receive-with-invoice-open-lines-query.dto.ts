import { IsOptional, IsUUID } from 'class-validator';

export class ReceiveWithInvoiceOpenLinesQueryDto {
  @IsUUID('7')
  supplierId: string;

  @IsOptional()
  @IsUUID('7')
  excludeInvoiceId?: string;
}
