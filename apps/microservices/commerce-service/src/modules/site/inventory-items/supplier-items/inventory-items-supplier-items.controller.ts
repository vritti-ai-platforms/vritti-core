import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import type { InventoryItemSupplierDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import { RpcSiteId } from '@vritti/api-sdk/nats';

@Controller()
export class InventoryItemsSupplierItemsController {
  private readonly logger = new Logger(InventoryItemsSupplierItemsController.name);

  constructor(private readonly service: SupplierItemsDomainService) {}

  @MessagePattern({ cmd: 'site.inventoryItems.suppliersTable' })
  async suppliersTable(
    @Payload() data: { inventoryItemId: string } & TableViewState,
    @RpcSiteId() siteId: string,
  ): Promise<{ result: InventoryItemSupplierDto[]; count: number }> {
    const { inventoryItemId, ...state } = data;
    this.logger.log(`inventoryItems.suppliersTable — inventoryItemId: ${inventoryItemId}`);
    return this.service.findSuppliersForItem(inventoryItemId, siteId, state);
  }

  @MessagePattern({ cmd: 'site.inventoryItems.suppliersFeed' })
  async suppliersFeed(
    @Payload() data: { inventoryItemId: string; limit: number; cursor?: string },
    @RpcSiteId() siteId: string,
  ): Promise<{
    edges: { cursor: string; node: InventoryItemSupplierDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log(`inventoryItems.suppliersFeed — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findSuppliersFeed(data.inventoryItemId, siteId, data.limit, data.cursor);
  }
}
