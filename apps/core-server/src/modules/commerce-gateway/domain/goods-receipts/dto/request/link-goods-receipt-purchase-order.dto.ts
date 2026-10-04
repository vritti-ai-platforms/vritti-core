import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class LinkGoodsReceiptPurchaseOrderDto {
  @ApiProperty({ description: 'Purchase order ID to link to the goods receipt.' })
  @IsUUID('7')
  purchaseOrderId: string;
}
