import { InventoryItemQuantItemsService } from '@domain/inventory-item-quant-items/services/inventory-item-quant-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SelectOptionsQueryDto, SelectQueryResult } from '@vritti/api-sdk';

@Controller()
export class InventoryItemQuantItemsController {
  private readonly logger = new Logger(InventoryItemQuantItemsController.name);

  constructor(private readonly service: InventoryItemQuantItemsService) {}

  // Returns paginated AVAILABLE quant items (physical units) for a given quant
  @MessagePattern({ cmd: 'inventoryItemQuantItems.select' })
  async select(@Payload() data: SelectOptionsQueryDto & { quantId: string }): Promise<SelectQueryResult> {
    this.logger.log(`inventoryItemQuantItems.select — quantId: ${data.quantId}`);
    return this.service.findForSelect(data);
  }
}
