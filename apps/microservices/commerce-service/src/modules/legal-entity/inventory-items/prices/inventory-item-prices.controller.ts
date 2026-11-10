import type { ItemSupplierPriceComparisonDto } from '@domain/supplier-item-prices/dto/entity/item-supplier-price-comparison.dto';
import type { InventoryItemPriceHistoryDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price-history.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { FilterCondition } from '@vritti/api-sdk/conditions';
import type { TableState } from '@vritti/api-sdk/data-table';
import { LeInventoryItemPricesService } from './services/inventory-item-prices.service';

@Controller()
export class LeInventoryItemPricesController {
  private readonly logger = new Logger(LeInventoryItemPricesController.name);

  constructor(private readonly service: LeInventoryItemPricesService) {}

  @MessagePattern({ cmd: 'le.inventoryItems.prices.table' })
  table(
    @Payload() data: { inventoryItemId: string } & TableState,
  ): Promise<{ result: ItemSupplierPriceComparisonDto[]; count: number }> {
    const { inventoryItemId, ...state } = data;
    this.logger.log(`inventoryItems.prices.table — inventoryItemId: ${inventoryItemId}`);
    return this.service.findTable(inventoryItemId, state);
  }

  @MessagePattern({ cmd: 'le.inventoryItems.prices.findHistory' })
  findHistory(
    @Payload()
    data: { inventoryItemId: string; siteId: string; context: FilterCondition[] },
  ): Promise<InventoryItemPriceHistoryDto> {
    const { inventoryItemId, siteId, context } = data;
    this.logger.log(`inventoryItems.prices.findAtSite — inventoryItemId: ${inventoryItemId}, siteId: ${siteId}`);
    return this.service.findHistory(inventoryItemId, siteId, context);
  }
}
