import type { InventoryItemQuantDto } from '@domain/inventory-item-quants/dto/entity/inventory-item-quant.dto';
import { InventoryItemQuantsDomainService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import { Injectable, Logger } from '@nestjs/common';
import type { TableViewState } from '@vritti/api-sdk/database';

// Top-level service for inventory-item per-quant table reads. Asserts parent-item
// existence before delegating to the quants domain service.
@Injectable()
export class InventoryItemsQuantsService {
  private readonly logger = new Logger(InventoryItemsQuantsService.name);

  constructor(
    private readonly inventoryItemsService: InventoryItemsDomainService,
    private readonly quantsService: InventoryItemQuantsDomainService,
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
    cursor?: string,
  ): Promise<{
    edges: { cursor: string; node: InventoryItemQuantDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log(`findFeed — inventoryItemId=${inventoryItemId}`);
    await this.inventoryItemsService.findById(inventoryItemId);
    return this.quantsService.findQuantsFeed(inventoryItemId, limit, cursor);
  }
}
