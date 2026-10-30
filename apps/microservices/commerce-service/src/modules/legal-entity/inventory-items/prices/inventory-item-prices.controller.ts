import type { ItemSupplierPriceComparisonDto } from '@domain/supplier-item-prices/dto/entity/item-supplier-price-comparison.dto';
import type { InventoryItemPriceHistoryDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price-history.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import type { SelectOptionsQueryDto, SelectQueryResult } from '@vritti/api-sdk/select';
import { LeInventoryItemPricesService } from './services/inventory-item-prices.service';

@Controller()
export class LeInventoryItemPricesController {
  private readonly logger = new Logger(LeInventoryItemPricesController.name);

  constructor(private readonly service: LeInventoryItemPricesService) {}

  @MessagePattern({ cmd: 'le.inventoryItems.prices.table' })
  table(
    @Payload() data: { inventoryItemId: string; siteId: string; asOf?: string } & TableViewState,
  ): Promise<{ result: ItemSupplierPriceComparisonDto[]; count: number }> {
    const { inventoryItemId, siteId, asOf, ...state } = data;
    this.logger.log(`inventoryItems.prices.table — inventoryItemId: ${inventoryItemId}, siteId: ${siteId}`);
    return this.service.findTable(inventoryItemId, siteId, state, asOf);
  }

  @MessagePattern({ cmd: 'le.inventoryItems.prices.siteIds' })
  siteIds(@Payload() data: { inventoryItemId: string }): Promise<string[]> {
    this.logger.log(`inventoryItems.prices.siteIds — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findSiteIds(data.inventoryItemId);
  }

  @MessagePattern({ cmd: 'le.inventoryItems.prices.findAtSite' })
  findAtSite(
    @Payload()
    data: {
      inventoryItemId: string;
      siteId: string;
      from?: string;
      to?: string;
      supplierIds?: string[];
      mrpIds?: string[];
    },
  ): Promise<InventoryItemPriceHistoryDto> {
    const { inventoryItemId, siteId, ...range } = data;
    this.logger.log(`inventoryItems.prices.findAtSite — inventoryItemId: ${inventoryItemId}, siteId: ${siteId}`);
    return this.service.findAtSite(inventoryItemId, siteId, range);
  }

  @MessagePattern({ cmd: 'le.inventoryItems.prices.mrps' })
  mrps(
    @Payload()
    data: { inventoryItemId: string; siteId: string; from?: string; to?: string } & SelectOptionsQueryDto,
  ): Promise<SelectQueryResult> {
    const { inventoryItemId, siteId, from, to, ...query } = data;
    this.logger.log(`inventoryItems.prices.mrps — inventoryItemId: ${inventoryItemId}, siteId: ${siteId}`);
    return this.service.findMrps(inventoryItemId, siteId, { from, to }, query);
  }

  @MessagePattern({ cmd: 'le.inventoryItems.prices.suppliers' })
  suppliers(
    @Payload()
    data: { inventoryItemId: string; siteId: string; from?: string; to?: string } & SelectOptionsQueryDto,
  ): Promise<SelectQueryResult> {
    const { inventoryItemId, siteId, from, to, ...query } = data;
    this.logger.log(`inventoryItems.prices.suppliers — inventoryItemId: ${inventoryItemId}, siteId: ${siteId}`);
    return this.service.findSuppliers(inventoryItemId, siteId, { from, to }, query);
  }
}
