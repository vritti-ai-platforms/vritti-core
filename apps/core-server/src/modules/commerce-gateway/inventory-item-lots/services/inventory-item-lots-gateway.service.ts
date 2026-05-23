import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService, type SelectQueryResult } from '@vritti/api-sdk';
import { LotsSelectQueryDto } from '../dto/request/lots-select-query.dto';

@Injectable()
export class InventoryItemLotsGatewayService {
  private readonly logger = new Logger(InventoryItemLotsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns paginated lot options, optionally filtered to a specific inventory item
  async select(query: LotsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`inventoryItems.selectLots — inventoryItemId: ${query.inventoryItemId ?? 'all'}`);
    return this.nats.send('commerce', 'inventoryItems.selectLots', query);
  }
}
