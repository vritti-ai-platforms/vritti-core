import type { InventoryItemLotDto } from '@domain/inventory-item-lots/dto/entity/inventory-item-lot.dto';
import { InventoryItemLotsService } from '@domain/inventory-item-lots/services/inventory-item-lots.service';
import { InventoryItemsService } from '@domain/inventory-items/services/inventory-items.service';
import { Injectable, Logger } from '@nestjs/common';
import type { TableViewState } from '@vritti/api-sdk';

@Injectable()
export class InventoryItemsLotsService {
  private readonly logger = new Logger(InventoryItemsLotsService.name);

  constructor(
    private readonly inventoryItemsService: InventoryItemsService,
    private readonly lotsService: InventoryItemLotsService,
  ) {}

  async findForTable(
    inventoryItemId: string,
    state: TableViewState,
  ): Promise<{ result: InventoryItemLotDto[]; count: number }> {
    this.logger.log(`findForTable — inventoryItemId=${inventoryItemId}`);
    await this.inventoryItemsService.findById(inventoryItemId);
    return this.lotsService.findLotsForTable(inventoryItemId, state);
  }
}
