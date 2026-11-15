import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { LeReceiveWithInvoiceDto } from './le-receive-with-invoice.dto';

export class LeCreateReceiveWithInvoiceDto extends LeReceiveWithInvoiceDto {
  @ApiProperty({ description: "The legal entity's site the goods are received at" })
  @IsUUID('7')
  siteId: string;
}
