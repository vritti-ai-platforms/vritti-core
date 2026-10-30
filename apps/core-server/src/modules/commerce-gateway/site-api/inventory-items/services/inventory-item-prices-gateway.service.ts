import type { InventoryItemPriceOptionsQueryDto } from '@commerce/inventory-items/dto/request/inventory-item-price-options-query.dto';
import type {
  InventoryItemPriceGraphResponseDto,
  InventoryItemPriceHistoryResponseDto,
} from '@commerce/inventory-items/dto/response/inventory-item-price-history-response.dto';
import { readPriceGraphSelection } from '@commerce/inventory-items/price-graph-selection';
import type { ItemSupplierPriceResponseDto } from '@commerce/supplier-item-prices/dto/response/item-supplier-price-response.dto';
import type { ItemSupplierPriceTableResponseDto } from '@commerce/supplier-item-prices/dto/response/item-supplier-price-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { SelectQueryResult } from '@vritti/api-sdk/select';

@Injectable()
export class SiteInventoryItemPricesGatewayService {
  private readonly logger = new Logger(SiteInventoryItemPricesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Every supplier's price rows for the item at this site, for the table
  async findTable(inventoryItemId: string, userId: string): Promise<ItemSupplierPriceTableResponseDto> {
    this.logger.log(`site.inventoryItems.prices.table — inventoryItemId: ${inventoryItemId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-site-inventory-item-${inventoryItemId}-prices`,
    );
    const { result, count } = await this.nats.send<{ result: ItemSupplierPriceResponseDto[]; count: number }>(
      'commerce',
      'site.inventoryItems.prices.table',
      { inventoryItemId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // The item's MRPs that supplier prices at this site were agreed against within a window, as select options
  findMrps(inventoryItemId: string, query: InventoryItemPriceOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`site.inventoryItems.prices.mrps — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'site.inventoryItems.prices.mrps', { inventoryItemId, ...query });
  }

  // The suppliers with a price for the item at this site within a window, as select options
  findSuppliers(inventoryItemId: string, query: InventoryItemPriceOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`site.inventoryItems.prices.suppliers — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'site.inventoryItems.prices.suppliers', { inventoryItemId, ...query });
  }

  // The item's suppliers' prices at this site the graph shows, per the item's primary unit, from the graph's saved
  // selection of window, suppliers and MRPs
  async findGraph(inventoryItemId: string, userId: string): Promise<InventoryItemPriceGraphResponseDto> {
    this.logger.log(`site.inventoryItems.prices.graph — inventoryItemId: ${inventoryItemId}`);
    const { state } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-site-inventory-item-${inventoryItemId}-price-graph`,
    );
    const selection = readPriceGraphSelection(state);
    const history = await this.nats.send<InventoryItemPriceHistoryResponseDto>(
      'commerce',
      'site.inventoryItems.prices.findHistory',
      {
        inventoryItemId,
        from: selection.from,
        to: selection.to,
        supplierIds: selection.supplierIds,
        mrpIds: selection.mrpIds,
      },
    );
    return { ...history, selection: { ...selection, siteId: history.siteId } };
  }
}
