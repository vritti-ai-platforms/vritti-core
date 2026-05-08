import type { InventoryItemQuantDto, LocationStockDto } from '@domain/inventory-item-quants/dto/entity/inventory-item-quant.dto';
import { InventoryItemQuantsService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { InventoryItemsService } from '@domain/inventory-items/services/inventory-items.service';
import { Injectable, Logger } from '@nestjs/common';
import type { TableViewState } from '@vritti/api-sdk';

// Top-level service for inventory-item batches reads. Asserts parent-item
// existence before delegating to the quants domain service.
@Injectable()
export class InventoryItemsBatchesService {
  private readonly logger = new Logger(InventoryItemsBatchesService.name);

  constructor(
    private readonly inventoryItemsService: InventoryItemsService,
    private readonly quantsService: InventoryItemQuantsService,
  ) {}

  async findForTable(
    itemId: string,
    state: TableViewState,
  ): Promise<{ result: InventoryItemQuantDto[]; count: number }> {
    this.logger.log(`findForTable — itemId=${itemId}`);
    await this.inventoryItemsService.findById(itemId);
    return this.quantsService.findBatchesForTable(itemId, state);
  }

  async findLocationStock(itemId: string): Promise<LocationStockDto[]> {
    this.logger.log(`findLocationStock — itemId=${itemId}`);
    await this.inventoryItemsService.findById(itemId);
    return this.quantsService.findLocationStockByItemId(itemId);
  }
}
