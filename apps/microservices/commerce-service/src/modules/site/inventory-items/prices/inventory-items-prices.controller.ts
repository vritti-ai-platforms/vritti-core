import type { ItemSupplierPriceDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price.dto';
import type { InventoryItemPriceHistoryDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price-history.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { FilterCondition } from '@vritti/api-sdk/conditions';
import type { TableState } from '@vritti/api-sdk/data-table';
import { RpcSiteId } from '@vritti/api-sdk/nats';
import { InventoryItemsPricesService } from './services/inventory-items-prices.service';

@Controller()
export class InventoryItemsPricesController {
  private readonly logger = new Logger(InventoryItemsPricesController.name);

  constructor(private readonly service: InventoryItemsPricesService) {}

  @MessagePattern({ cmd: 'site.inventoryItems.prices.table' })
  table(
    @Payload() data: { inventoryItemId: string } & TableState,
    @RpcSiteId() siteId: string,
  ): Promise<{ result: ItemSupplierPriceDto[]; count: number }> {
    const { inventoryItemId, ...state } = data;
    this.logger.log(`inventoryItems.prices.table — inventoryItemId: ${inventoryItemId}`);
    return this.service.findForTable(inventoryItemId, siteId, state);
  }

  @MessagePattern({ cmd: 'site.inventoryItems.prices.findHistory' })
  findHistory(
    @Payload()
    data: { inventoryItemId: string; context: FilterCondition[] },
    @RpcSiteId() siteId: string,
  ): Promise<InventoryItemPriceHistoryDto> {
    const { inventoryItemId, context } = data;
    this.logger.log(`inventoryItems.prices.findHistory — inventoryItemId: ${inventoryItemId}`);
    return this.service.findHistory(inventoryItemId, siteId, context);
  }
}
