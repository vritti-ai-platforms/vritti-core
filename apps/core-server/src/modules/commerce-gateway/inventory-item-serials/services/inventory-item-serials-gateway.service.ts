import { Injectable, Logger } from '@nestjs/common';
import type { SelectQueryResult } from '@vritti/api-sdk';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { SerialsSelectQueryDto } from '../dto/request/serials-select-query.dto';

@Injectable()
export class InventoryItemSerialsGatewayService {
  private readonly logger = new Logger(InventoryItemSerialsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns paginated AVAILABLE serials, optionally filtered to a specific inventory quant
  async select(query: SerialsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`inventoryItems.selectSerials — quantId: ${query.quantId ?? 'all'}`);
    return this.nats.send('commerce', 'inventoryItems.selectSerials', query);
  }
}
