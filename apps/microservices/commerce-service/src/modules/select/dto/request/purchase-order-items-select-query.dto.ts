import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID } from 'class-validator';

export class PurchaseOrderItemsSelectQueryDto extends SelectOptionsQueryDto {
  @IsUUID('7')
  purchaseOrderId: string;

  @IsOptional()
  @IsUUID('7')
  excludeOnGoodsReceiptId?: string;
}
