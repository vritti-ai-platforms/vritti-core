import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { RpcLeCurrencyCode } from '@vritti/api-sdk/nats';
import type { InventoryItemLotWithDisplayDto } from './dto/entity/inventory-item-lot-with-display.dto';
import { InventoryItemsLotsService } from './services/inventory-items-lots.service';

@Controller()
export class InventoryItemsLotsController {
  private readonly logger = new Logger(InventoryItemsLotsController.name);

  constructor(private readonly itemsLotsService: InventoryItemsLotsService) {}

  // Returns paginated lots for an inventory item data table (one row per lot, with stock totals)
  @MessagePattern({ cmd: 'site.inventoryItems.lotsTable' })
  async lotsTable(
    @Payload() data: { inventoryItemId: string } & TableState,
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<{ result: InventoryItemLotWithDisplayDto[]; count: number }> {
    this.logger.log(`inventoryItems.lotsTable — inventoryItemId: ${data.inventoryItemId}`);
    return this.itemsLotsService.findForTable(data.inventoryItemId, data, leCurrencyCode);
  }
}
