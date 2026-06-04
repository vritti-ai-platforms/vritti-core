import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class LinkGoodsReceiptPurchaseOrderDto {
  @ApiProperty({ description: 'Purchase order ID to link to the goods receipt.' })
  @IsUUID()
  purchaseOrderId: string;
}
