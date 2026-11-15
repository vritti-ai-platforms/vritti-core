import { IsUUID } from 'class-validator';
import { InvoiceableGoodsReceiptsQueryDto } from './invoiceable-goods-receipts-query.dto';

export class LeInvoiceableGoodsReceiptsQueryDto extends InvoiceableGoodsReceiptsQueryDto {
  @IsUUID('7')
  siteId: string;
}
