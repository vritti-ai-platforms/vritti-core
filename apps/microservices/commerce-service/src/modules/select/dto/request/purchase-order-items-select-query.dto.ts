import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { IsOptional, IsUUID } from 'class-validator';

export class PurchaseOrderItemsSelectQueryDto extends SelectOptionsQueryDto {
  @IsUUID()
  purchaseOrderId: string;

  @IsOptional()
  @IsUUID()
  excludeOnGoodsReceiptId?: string;
}
