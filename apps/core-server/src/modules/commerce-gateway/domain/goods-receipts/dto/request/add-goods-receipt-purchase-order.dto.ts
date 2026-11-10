import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddGoodsReceiptPurchaseOrderDto {
  @ApiProperty({
    description:
      "Another confirmed or partially received purchase order of the receipt's supplier at its site; every open line is added",
  })
  @IsUUID('7')
  purchaseOrderId: string;
}
