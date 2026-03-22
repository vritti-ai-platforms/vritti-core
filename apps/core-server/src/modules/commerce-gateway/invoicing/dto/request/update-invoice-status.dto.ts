import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { InvoiceStatusValues } from '../../../commerce-enums';

export class UpdateInvoiceStatusDto {
  @ApiProperty({ enum: Object.values(InvoiceStatusValues) })
  @IsEnum(InvoiceStatusValues)
  status: string;
}
