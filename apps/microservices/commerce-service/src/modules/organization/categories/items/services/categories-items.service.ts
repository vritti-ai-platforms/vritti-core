import type { InventoryItemDto } from '@domain/inventory-items/dto/entity/inventory-item.dto';
import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import { Injectable, Logger } from '@nestjs/common';
import type { TableViewState } from '@vritti/api-sdk/database';

@Injectable()
export class CategoriesItemsService {
  private readonly logger = new Logger(CategoriesItemsService.name);

  constructor(private readonly inventoryItemsService: InventoryItemsDomainService) {}

  // Returns the inventory items linked to a leaf category, table-shaped (delegates to the inventory-items domain)
  async findItemsForTable(
    categoryId: string,
    state: TableViewState,
  ): Promise<{ result: InventoryItemDto[]; count: number }> {
    this.logger.log(`categories.itemsTable — categoryId: ${categoryId}`);
    return this.inventoryItemsService.findForTableByCategory(categoryId, state);
  }
}
