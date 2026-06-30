import type { InventoryItemQuantDto } from '@domain/inventory-item-quants/dto/entity/inventory-item-quant.dto';
import { InventoryItemQuantsService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { InventoryItemsService } from '@domain/inventory-items/services/inventory-items.service';
import { Injectable, Logger } from '@nestjs/common';
import type { TableViewState } from '@vritti/api-sdk';

// Top-level service for inventory-item per-quant table reads. Asserts parent-item
// existence before delegating to the quants domain service.
@Injectable()
export class InventoryItemsQuantsService {
  private readonly logger = new Logger(InventoryItemsQuantsService.name);

  constructor(
    private readonly inventoryItemsService: InventoryItemsService,
    private readonly quantsService: InventoryItemQuantsService,
  ) {}

  async findForTable(
    inventoryItemId: string,
    state: TableViewState,
  ): Promise<{ result: InventoryItemQuantDto[]; count: number }> {
    this.logger.log(`findForTable — inventoryItemId=${inventoryItemId}`);
    await this.inventoryItemsService.findById(inventoryItemId);
    return this.quantsService.findQuantsForTable(inventoryItemId, state);
  }

  async findFeed(
    inventoryItemId: string,
    limit: number,
    offset: number,
  ): Promise<{ result: InventoryItemQuantDto[]; count: number }> {
    this.logger.log(`findFeed — inventoryItemId=${inventoryItemId}`);
    await this.inventoryItemsService.findById(inventoryItemId);
    return this.quantsService.findQuantsFeed(inventoryItemId, limit, offset);
  }
}
