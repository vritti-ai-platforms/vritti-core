import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService, type SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk';

@Injectable()
export class InventoryItemLotsGatewayService {
  private readonly logger = new Logger(InventoryItemLotsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns paginated lot options for a given inventory item
  async select(query: SelectOptionsQueryDto & { inventoryItemId: string }): Promise<SelectQueryResult> {
    this.logger.log(`inventoryItemLots.select — inventoryItemId: ${query.inventoryItemId}`);
    return this.nats.send('commerce', 'inventoryItemLots.select', query);
  }
}
