import type { InventoryItemPriceHistoryResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-price-history-response.dto';
import type { ItemSupplierPriceResponseDto } from '@commerce/supplier-item-prices/dto/response/item-supplier-price-response.dto';
import type { ItemSupplierPriceTableResponseDto } from '@commerce/supplier-item-prices/dto/response/item-supplier-price-table-response.dto';
import { withDefaultPeriod } from '@commerce/supplier-item-prices/price-period';
import { Injectable, Logger } from '@nestjs/common';
import { ContextStateService } from '@vritti/api-sdk/context-state';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class SiteInventoryItemPricesGatewayService {
  private readonly logger = new Logger(SiteInventoryItemPricesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
    private readonly contextStateService: ContextStateService,
  ) {}

  // Every supplier's price rows for the item at this site, for the table
  async findTable(inventoryItemId: string, userId: string): Promise<ItemSupplierPriceTableResponseDto> {
    this.logger.log(`site.inventoryItems.prices.table — inventoryItemId: ${inventoryItemId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
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

  // The item's suppliers' prices at this site, per the item's primary unit, at the history's saved context
  async findHistory(inventoryItemId: string, userId: string): Promise<InventoryItemPriceHistoryResponseDto> {
    this.logger.log(`site.inventoryItems.prices.findHistory — inventoryItemId: ${inventoryItemId}`);
    const slug = `commerce-site-inventory-item-${inventoryItemId}-price-history`;
    const context = await this.contextStateService.getContextState(userId, slug);
    return this.nats.send<InventoryItemPriceHistoryResponseDto>('commerce', 'site.inventoryItems.prices.findHistory', {
      inventoryItemId,
      context: withDefaultPeriod(context),
    });
  }
}
