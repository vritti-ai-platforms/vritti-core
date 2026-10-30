import type { ItemSupplierPriceDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price.dto';
import type { InventoryItemPriceHistoryDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price-history.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import { RpcSiteId } from '@vritti/api-sdk/nats';
import type { SelectOptionsQueryDto, SelectQueryResult } from '@vritti/api-sdk/select';
import { InventoryItemsPricesService } from './services/inventory-items-prices.service';

@Controller()
export class InventoryItemsPricesController {
  private readonly logger = new Logger(InventoryItemsPricesController.name);

  constructor(private readonly service: InventoryItemsPricesService) {}

  @MessagePattern({ cmd: 'site.inventoryItems.prices.table' })
  table(
    @Payload() data: { inventoryItemId: string } & TableViewState,
    @RpcSiteId() siteId: string,
  ): Promise<{ result: ItemSupplierPriceDto[]; count: number }> {
    const { inventoryItemId, ...state } = data;
    this.logger.log(`inventoryItems.prices.table — inventoryItemId: ${inventoryItemId}`);
    return this.service.findForTable(inventoryItemId, siteId, state);
  }

  @MessagePattern({ cmd: 'site.inventoryItems.prices.findHistory' })
  findHistory(
    @Payload()
    data: { inventoryItemId: string; from?: string; to?: string; supplierIds?: string[]; mrpIds?: string[] },
    @RpcSiteId() siteId: string,
  ): Promise<InventoryItemPriceHistoryDto> {
    const { inventoryItemId, ...range } = data;
    this.logger.log(`inventoryItems.prices.findHistory — inventoryItemId: ${inventoryItemId}`);
    return this.service.findHistory(inventoryItemId, siteId, range);
  }

  @MessagePattern({ cmd: 'site.inventoryItems.prices.mrps' })
  mrps(
    @Payload() data: { inventoryItemId: string; from?: string; to?: string } & SelectOptionsQueryDto,
    @RpcSiteId() siteId: string,
  ): Promise<SelectQueryResult> {
    const { inventoryItemId, from, to, ...query } = data;
    this.logger.log(`inventoryItems.prices.mrps — inventoryItemId: ${inventoryItemId}`);
    return this.service.findMrps(inventoryItemId, siteId, { from, to }, query);
  }

  @MessagePattern({ cmd: 'site.inventoryItems.prices.suppliers' })
  suppliers(
    @Payload() data: { inventoryItemId: string; from?: string; to?: string } & SelectOptionsQueryDto,
    @RpcSiteId() siteId: string,
  ): Promise<SelectQueryResult> {
    const { inventoryItemId, from, to, ...query } = data;
    this.logger.log(`inventoryItems.prices.suppliers — inventoryItemId: ${inventoryItemId}`);
    return this.service.findSuppliers(inventoryItemId, siteId, { from, to }, query);
  }
}
