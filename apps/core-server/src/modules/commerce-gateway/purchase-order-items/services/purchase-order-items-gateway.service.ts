import { Injectable, Logger } from '@nestjs/common';
import type { SelectQueryResult } from '@vritti/api-sdk';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { PurchaseOrderItemsSelectQueryDto } from '../dto/request/purchase-order-items-select-query.dto';

@Injectable()
export class PurchaseOrderItemsGatewayService {
  private readonly logger = new Logger(PurchaseOrderItemsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns paginated PO line options for the GR AddItem selector, with pricing/quantity additionals for direct payload post
  async select(query: PurchaseOrderItemsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`purchaseOrderItems.select — poId: ${query.purchaseOrderId}`);
    return this.nats.send('commerce', 'purchaseOrderItems.select', query);
  }
}
