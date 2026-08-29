import type { InventoryBatchResponseDto } from '@commerce/inventory-item-quants/dto/response/inventory-batch-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class InventoryItemQuantsGatewayService {
  private readonly logger = new Logger(InventoryItemQuantsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns a single inventory batch by ID
  async findById(id: string): Promise<InventoryBatchResponseDto> {
    this.logger.log(`inventoryItems.findQuantById — id: ${id}`);
    return this.nats.send('commerce', 'site.inventoryItems.findQuantById', { id });
  }
}
