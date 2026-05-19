import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService, type SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk';

@Injectable()
export class InventoryItemSerialsGatewayService {
  private readonly logger = new Logger(InventoryItemSerialsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns paginated AVAILABLE serials for a given quant
  async select(query: SelectOptionsQueryDto & { quantId: string }): Promise<SelectQueryResult> {
    this.logger.log(`inventoryItems.selectSerials — quantId: ${query.quantId}`);
    return this.nats.send('commerce', 'inventoryItems.selectSerials', query);
  }
}
