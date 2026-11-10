import type { InventoryItemPriceHistoryResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-price-history-response.dto';
import type {
  ItemSupplierPriceComparisonResponseDto,
  ItemSupplierPriceComparisonTableResponseDto,
} from '@commerce/inventory-items/dto/response/item-supplier-price-comparison-response.dto';
import { withDefaultPeriod } from '@commerce/supplier-item-prices/price-period';
import { Injectable, Logger } from '@nestjs/common';
import { conditionValue } from '@vritti/api-sdk/conditions';
import { ContextStateService } from '@vritti/api-sdk/context-state';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class LeInventoryItemPricesGatewayService {
  private readonly logger = new Logger(LeInventoryItemPricesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
    private readonly contextStateService: ContextStateService,
  ) {}

  // Every supplier's standing for the item at the site and on the day in the table's context
  async findTable(inventoryItemId: string, userId: string): Promise<ItemSupplierPriceComparisonTableResponseDto> {
    this.logger.log(`le.inventoryItems.prices.table — inventoryItemId: ${inventoryItemId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-le-inventory-item-${inventoryItemId}-prices`,
    );
    const { result, count } = await this.nats.send<{ result: ItemSupplierPriceComparisonResponseDto[]; count: number }>(
      'commerce',
      'le.inventoryItems.prices.table',
      { inventoryItemId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // The item's suppliers' prices at the history's site, per the item's primary unit, at the history's saved context; nothing
  // until a site is picked
  async findHistory(inventoryItemId: string, userId: string): Promise<InventoryItemPriceHistoryResponseDto> {
    this.logger.log(`le.inventoryItems.prices.findHistory — inventoryItemId: ${inventoryItemId}`);
    const slug = `commerce-le-inventory-item-${inventoryItemId}-price-history`;
    const context = await this.contextStateService.getContextState(userId, slug);
    const siteId = conditionValue(context, 'site');
    if (!siteId) return { currency: null, lines: [] };

    return this.nats.send<InventoryItemPriceHistoryResponseDto>('commerce', 'le.inventoryItems.prices.findHistory', {
      inventoryItemId,
      siteId,
      context: withDefaultPeriod(context),
    });
  }
}
