import type { InventoryItemLotDto } from '@domain/inventory-item-lots/dto/entity/inventory-item-lot.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/database';
import { RpcSiteCurrencyCode } from '@vritti/api-sdk/nats';
import { InventoryItemsLotsService } from './services/inventory-items-lots.service';

@Controller()
export class InventoryItemsLotsController {
  private readonly logger = new Logger(InventoryItemsLotsController.name);

  constructor(private readonly itemsLotsService: InventoryItemsLotsService) {}

  // Returns paginated lots for an inventory item data table (one row per lot, with stock totals)
  @MessagePattern({ cmd: 'site.inventoryItems.lotsTable' })
  async lotsTable(
    @Payload() data: { inventoryItemId: string } & TableViewState,
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<{ result: InventoryItemLotDto[]; count: number }> {
    this.logger.log(`inventoryItems.lotsTable — inventoryItemId: ${data.inventoryItemId}`);
    return this.itemsLotsService.findForTable(data.inventoryItemId, data, siteCurrencyCode);
  }
}
