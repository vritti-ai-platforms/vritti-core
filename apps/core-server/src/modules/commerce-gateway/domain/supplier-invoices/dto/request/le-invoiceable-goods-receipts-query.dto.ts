import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { InvoiceableGoodsReceiptsQueryDto } from './invoiceable-goods-receipts-query.dto';

export class LeInvoiceableGoodsReceiptsQueryDto extends InvoiceableGoodsReceiptsQueryDto {
  @ApiProperty({ description: 'Supplier whose receipts are listed' })
  @IsUUID('7')
  supplierId: string;
}
