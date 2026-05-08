import { InventoryItemQuantItemsService } from '@domain/inventory-item-quant-items/services/inventory-item-quant-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SelectOptionsQueryDto, SelectQueryResult } from '@vritti/api-sdk';

@Controller()
export class InventoryItemsQuantItemsController {
  private readonly logger = new Logger(InventoryItemsQuantItemsController.name);

  constructor(private readonly service: InventoryItemQuantItemsService) {}

  // Returns paginated AVAILABLE quant items (physical units) for a given quant
  @MessagePattern({ cmd: 'inventoryItems.selectQuantItems' })
  async select(@Payload() data: SelectOptionsQueryDto & { quantId: string }): Promise<SelectQueryResult> {
    this.logger.log(`inventoryItems.selectQuantItems — quantId: ${data.quantId}`);
    return this.service.findForSelect(data);
  }
}
