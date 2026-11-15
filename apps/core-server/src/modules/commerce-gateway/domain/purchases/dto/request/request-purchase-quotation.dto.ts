import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RequestPurchaseQuotationDto {
  @ApiProperty({ description: 'Supplier the draft quotation is requested from' })
  @IsUUID('7')
  supplierId: string;
}
