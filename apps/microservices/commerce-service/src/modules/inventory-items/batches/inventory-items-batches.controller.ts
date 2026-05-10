import type { InventoryItemQuantDto } from '@domain/inventory-item-quants/dto/entity/inventory-item-quant.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk';
import { InventoryItemsBatchesService } from './services/inventory-items-batches.service';

@Controller()
export class InventoryItemsBatchesController {
  private readonly logger = new Logger(InventoryItemsBatchesController.name);

  constructor(private readonly service: InventoryItemsBatchesService) {}

  @MessagePattern({ cmd: 'inventoryItems.batchesTable' })
  async batchesTable(
    @Payload() data: { itemId: string } & TableViewState,
  ): Promise<{ result: InventoryItemQuantDto[]; count: number }> {
    this.logger.log(`inventoryItems.batchesTable — itemId: ${data.itemId}`);
    return this.service.findForTable(data.itemId, data);
  }
}
