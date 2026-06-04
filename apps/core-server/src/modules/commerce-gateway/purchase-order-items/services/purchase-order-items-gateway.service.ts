import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService, type SelectQueryResult } from '@vritti/api-sdk';
import type { PurchaseOrderItemsSelectQueryDto } from '../dto/request/purchase-order-items-select-query.dto';

@Injectable()
export class PurchaseOrderItemsGatewayService {
  private readonly logger = new Logger(PurchaseOrderItemsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns paginated PO line options for the GR AddItem selector. The option `additionals` carry
  // (inventoryItemId, uomId, unitPrice, currencyCode, allowDecimal, symbol, orderedQuantity,
  // receivedQuantity) so the dialog can post the GR add-item payload directly.
  async select(query: PurchaseOrderItemsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`purchaseOrderItems.select — poId: ${query.purchaseOrderId}`);
    return this.nats.send('commerce', 'purchaseOrderItems.select', query);
  }
}
