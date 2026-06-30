import type { LocationStockDto } from '@domain/inventory-item-quants/dto/entity/inventory-item-quant.dto';
import { InventoryItemQuantsService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { InventoryItemsService } from '@domain/inventory-items/services/inventory-items.service';
import { Injectable, Logger } from '@nestjs/common';

// Top-level service for inventory-item per-location stock aggregates.
// Sources from inventory_item_quants (the actual stock rows) — separate from inventory_item_locations
// (the user-configured registry with reorder thresholds, served by the locations sub-module).
@Injectable()
export class InventoryItemsStocksService {
  private readonly logger = new Logger(InventoryItemsStocksService.name);

  constructor(
    private readonly inventoryItemsService: InventoryItemsService,
    private readonly quantsService: InventoryItemQuantsService,
  ) {}

  async findStocks(inventoryItemId: string): Promise<LocationStockDto[]> {
    this.logger.log(`findStocks — inventoryItemId=${inventoryItemId}`);
    await this.inventoryItemsService.findById(inventoryItemId);
    return this.quantsService.findLocationStockByInventoryItemId(inventoryItemId);
  }

  // Offset-paginated stock aggregate for the mobile Relay feed (can exceed 100 locations).
  async findStocksFeed(
    inventoryItemId: string,
    limit: number,
    offset: number,
  ): Promise<{ result: LocationStockDto[]; count: number }> {
    this.logger.log(`findStocksFeed — inventoryItemId=${inventoryItemId} limit=${limit} offset=${offset}`);
    await this.inventoryItemsService.findById(inventoryItemId);
    return this.quantsService.findLocationStockPage(inventoryItemId, limit, offset);
  }
}
