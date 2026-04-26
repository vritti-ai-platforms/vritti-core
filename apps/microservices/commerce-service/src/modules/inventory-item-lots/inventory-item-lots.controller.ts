import { InventoryItemLotsService } from '@domain/inventory-item-lots/services/inventory-item-lots.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SelectOptionsQueryDto, SelectQueryResult } from '@vritti/api-sdk';

@Controller()
export class InventoryItemLotsController {
  private readonly logger = new Logger(InventoryItemLotsController.name);

  constructor(private readonly service: InventoryItemLotsService) {}

  // Returns paginated lot options scoped to a single inventory item
  @MessagePattern({ cmd: 'inventoryItemLots.select' })
  async select(@Payload() data: SelectOptionsQueryDto & { inventoryItemId: string }): Promise<SelectQueryResult> {
    this.logger.log(`inventoryItemLots.select — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findForSelect(data);
  }
}
