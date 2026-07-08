import type { InventoryItemLedgerDto } from '@domain/inventory-item-ledger/dto/entity/inventory-item-ledger.dto';
import { InventoryItemLedgerService } from '@domain/inventory-item-ledger/services/inventory-item-ledger.service';
import { InventoryItemsService } from '@domain/inventory-items/services/inventory-items.service';
import { Injectable, Logger } from '@nestjs/common';
import type { TableViewState } from '@vritti/api-sdk/database';

@Injectable()
export class InventoryItemsLedgerService {
  private readonly logger = new Logger(InventoryItemsLedgerService.name);

  constructor(
    private readonly inventoryItemsService: InventoryItemsService,
    private readonly ledgerService: InventoryItemLedgerService,
  ) {}

  // Returns paginated ledger entries for an inventory item data table
  async findForTable(
    inventoryItemId: string,
    state: TableViewState,
  ): Promise<{ result: InventoryItemLedgerDto[]; count: number }> {
    this.logger.log(`findForTable — inventoryItemId=${inventoryItemId}`);
    await this.inventoryItemsService.findById(inventoryItemId);
    return this.ledgerService.findForTable(state);
  }
}
