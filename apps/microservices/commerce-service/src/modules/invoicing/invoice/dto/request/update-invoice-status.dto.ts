import { IsEnum, IsUUID } from 'class-validator';
import { InvoiceStatusValues } from '@/db/schema';

export class UpdateInvoiceStatusDto {
  @IsUUID()
  id: string;

  @IsEnum(InvoiceStatusValues)
  status: string;
}
