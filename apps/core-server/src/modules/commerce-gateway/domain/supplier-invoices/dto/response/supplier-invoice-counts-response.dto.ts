import { ApiProperty } from '@nestjs/swagger';

export class SupplierInvoiceCountsResponseDto {
  @ApiProperty({ description: 'Item and charge lines on the invoice', example: 6 })
  lineCount: number;

  @ApiProperty({ description: 'Holds on the invoice, released ones included', example: 1 })
  holdCount: number;
}
