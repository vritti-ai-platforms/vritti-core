import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService, type SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk';

@Injectable()
export class InventoryItemQuantItemsGatewayService {
  private readonly logger = new Logger(InventoryItemQuantItemsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns paginated AVAILABLE quant items (physical units) for a given quant
  async select(query: SelectOptionsQueryDto & { quantId: string }): Promise<SelectQueryResult> {
    this.logger.log(`inventoryItems.selectQuantItems — quantId: ${query.quantId}`);
    return this.nats.send('commerce', 'inventoryItems.selectQuantItems', query);
  }
}
