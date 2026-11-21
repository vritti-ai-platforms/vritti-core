import { ApiProperty } from '@nestjs/swagger';

export class PurchaseOrderCountsResponseDto {
  @ApiProperty({ description: 'Lines on the order', example: 8 })
  itemCount: number;

  @ApiProperty({ description: 'Inbound deliveries carrying a line of the order', example: 2 })
  inboundDeliveryCount: number;

  @ApiProperty({ description: 'Goods receipts counting a line of the order, drafts included', example: 2 })
  goodsReceiptCount: number;

  @ApiProperty({ description: 'Supplier invoices with a line on the order, cancelled ones included', example: 1 })
  invoiceCount: number;
}
