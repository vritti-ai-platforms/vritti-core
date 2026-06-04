import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService, type SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk';
import type { InventoryBatchResponseDto } from '../dto/response/inventory-batch-response.dto';

@Injectable()
export class InventoryItemQuantsGatewayService {
  private readonly logger = new Logger(InventoryItemQuantsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns a single inventory batch by ID
  async findById(id: string): Promise<InventoryBatchResponseDto> {
    this.logger.log(`inventoryItems.findQuantById — id: ${id}`);
    return this.nats.send('commerce', 'inventoryItems.findQuantById', { id });
  }

  async select(query: SelectOptionsQueryDto & { inventoryItemId: string }): Promise<SelectQueryResult> {
    this.logger.log(`inventoryItems.selectQuants — inventoryItemId: ${query.inventoryItemId}`);
    return this.nats.send('commerce', 'inventoryItems.selectQuants', query);
  }
}
