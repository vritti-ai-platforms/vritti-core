import { PurchaseOrderItemsService } from '@domain/purchase-order-items/services/purchase-order-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SelectOptionsQueryDto, SelectQueryResult } from '@vritti/api-sdk/database';

@Controller()
export class PurchaseOrderItemsController {
  private readonly logger = new Logger(PurchaseOrderItemsController.name);

  constructor(private readonly service: PurchaseOrderItemsService) {}

  @MessagePattern({ cmd: 'site.purchaseOrderItems.select' })
  async select(
    @Payload()
    data: SelectOptionsQueryDto & {
      purchaseOrderId: string;
      excludeOnGoodsReceiptId?: string;
    },
  ): Promise<SelectQueryResult> {
    const { purchaseOrderId, excludeOnGoodsReceiptId, ...query } = data;
    this.logger.log(`purchaseOrderItems.select — poId: ${purchaseOrderId}`);
    return this.service.findForSelectByPo(purchaseOrderId, query, { excludeOnGoodsReceiptId });
  }
}
