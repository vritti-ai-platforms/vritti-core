import { IsUUID } from 'class-validator';

export class AddGoodsReceiptPurchaseOrderDto {
  @IsUUID('7')
  goodsReceiptId: string;

  @IsUUID('7')
  purchaseOrderId: string;
}
