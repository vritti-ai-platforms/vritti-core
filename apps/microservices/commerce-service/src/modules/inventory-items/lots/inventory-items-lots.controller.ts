import type { InventoryItemLotDto } from '@domain/inventory-item-lots/dto/entity/inventory-item-lot.dto';
import { InventoryItemLotsService } from '@domain/inventory-item-lots/services/inventory-item-lots.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SelectOptionsQueryDto, SelectQueryResult, TableViewState } from '@vritti/api-sdk';
import { InventoryItemsLotsService } from './services/inventory-items-lots.service';

@Controller()
export class InventoryItemsLotsController {
  private readonly logger = new Logger(InventoryItemsLotsController.name);

  constructor(
    private readonly service: InventoryItemLotsService,
    private readonly itemsLotsService: InventoryItemsLotsService,
  ) {}

  // Returns paginated lots for an inventory item data table (one row per lot, with stock totals)
  @MessagePattern({ cmd: 'inventoryItems.lotsTable' })
  async lotsTable(
    @Payload() data: { itemId: string } & TableViewState,
  ): Promise<{ result: InventoryItemLotDto[]; count: number }> {
    this.logger.log(`inventoryItems.lotsTable — itemId: ${data.itemId}`);
    return this.itemsLotsService.findForTable(data.itemId, data);
  }

  // Returns paginated lot options, optionally filtered to a specific inventory item
  @MessagePattern({ cmd: 'inventoryItems.selectLots' })
  async select(@Payload() data: SelectOptionsQueryDto & { inventoryItemId?: string }): Promise<SelectQueryResult> {
    this.logger.log(`inventoryItems.selectLots — inventoryItemId: ${data.inventoryItemId ?? 'all'}`);
    return this.service.findForSelect(data);
  }
}
