import type { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import { GoodsReceiptsDomainService } from '@domain/goods-receipts/services/goods-receipts.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';

@Controller()
export class LePurchaseOrdersGoodsReceiptsController {
  private readonly logger = new Logger(LePurchaseOrdersGoodsReceiptsController.name);

  constructor(private readonly goodsReceiptsService: GoodsReceiptsDomainService) {}

  // Returns one page of the goods receipts counted against a purchase order
  @MessagePattern({ cmd: 'le.purchaseOrders.goodsReceipts' })
  goodsReceipts(
    @Payload() data: { purchaseOrderId: string } & TableState,
  ): Promise<{ result: GoodsReceiptDto[]; count: number }> {
    this.logger.log(`le.purchaseOrders.goodsReceipts — id: ${data.purchaseOrderId}`);
    const { purchaseOrderId, ...state } = data;
    return this.goodsReceiptsService.findForTable(state, { purchaseOrderId });
  }
}
