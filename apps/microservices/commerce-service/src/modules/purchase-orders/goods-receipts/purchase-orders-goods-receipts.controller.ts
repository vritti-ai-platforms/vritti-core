import type { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import { GoodsReceiptsService } from '@domain/goods-receipts/services/goods-receipts.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class PurchaseOrdersGoodsReceiptsController {
  private readonly logger = new Logger(PurchaseOrdersGoodsReceiptsController.name);

  constructor(private readonly goodsReceiptsService: GoodsReceiptsService) {}

  @MessagePattern({ cmd: 'purchaseOrders.goodsReceipts' })
  goodsReceipts(
    @Payload() data: { purchaseOrderId: string } & TableViewState,
  ): Promise<{ result: GoodsReceiptDto[]; count: number }> {
    this.logger.log(`purchaseOrders.goodsReceipts — id: ${data.purchaseOrderId}`);
    const { purchaseOrderId, ...state } = data;
    return this.goodsReceiptsService.findForTableByPoId(purchaseOrderId, state);
  }
}
