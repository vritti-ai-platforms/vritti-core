import { SupplierItemsService } from '@domain/supplier-items/services/supplier-items.service';
import type { InventoryItemSupplierDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class InventoryItemsSupplierItemsController {
  private readonly logger = new Logger(InventoryItemsSupplierItemsController.name);

  constructor(private readonly service: SupplierItemsService) {}

  @MessagePattern({ cmd: 'inventoryItems.suppliersTable' })
  async suppliersTable(
    @Payload() data: { inventoryItemId: string } & TableViewState,
  ): Promise<{ result: InventoryItemSupplierDto[]; count: number }> {
    const { inventoryItemId, ...state } = data;
    this.logger.log(`inventoryItems.suppliersTable — inventoryItemId: ${inventoryItemId}`);
    return this.service.findSuppliersForItem(inventoryItemId, state);
  }

  @MessagePattern({ cmd: 'inventoryItems.suppliersFeed' })
  async suppliersFeed(
    @Payload() data: { inventoryItemId: string; limit: number; cursor?: string },
  ): Promise<{
    edges: { cursor: string; node: InventoryItemSupplierDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log(`inventoryItems.suppliersFeed — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findSuppliersFeed(data.inventoryItemId, data.limit, data.cursor);
  }
}
