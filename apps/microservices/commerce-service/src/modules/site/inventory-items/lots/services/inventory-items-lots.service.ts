import type { InventoryItemLotDto } from '@domain/inventory-item-lots/dto/entity/inventory-item-lot.dto';
import { InventoryItemLotsDomainService } from '@domain/inventory-item-lots/services/inventory-item-lots.service';
import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import { Injectable, Logger } from '@nestjs/common';
import type { TableViewState } from '@vritti/api-sdk/database';

@Injectable()
export class InventoryItemsLotsService {
  private readonly logger = new Logger(InventoryItemsLotsService.name);

  constructor(
    private readonly inventoryItemsService: InventoryItemsDomainService,
    private readonly lotsService: InventoryItemLotsDomainService,
  ) {}

  async findForTable(
    inventoryItemId: string,
    state: TableViewState,
    siteCurrencyCode?: string,
  ): Promise<{ result: InventoryItemLotDto[]; count: number }> {
    this.logger.log(`findForTable — inventoryItemId=${inventoryItemId}`);
    await this.inventoryItemsService.findById(inventoryItemId);
    return this.lotsService.findLotsForTable(inventoryItemId, state, siteCurrencyCode);
  }
}
