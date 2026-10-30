import type { InventoryItemPriceOptionsQueryDto } from '@commerce/inventory-items/dto/request/inventory-item-price-options-query.dto';
import type { InventoryItemPricesTableQueryDto } from '@commerce/inventory-items/dto/request/inventory-item-prices-table-query.dto';
import type {
  InventoryItemPriceGraphResponseDto,
  InventoryItemPriceHistoryResponseDto,
} from '@commerce/inventory-items/dto/response/inventory-item-price-history-response.dto';
import type {
  ItemSupplierPriceComparisonResponseDto,
  ItemSupplierPriceComparisonTableResponseDto,
} from '@commerce/inventory-items/dto/response/item-supplier-price-comparison-response.dto';
import { readPriceGraphSelection } from '@commerce/inventory-items/price-graph-selection';
import { SiteDomainRepository } from '@domain/site/repositories/site.repository';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/select';

// The as-of filter's relative days, as the table's date filter saves them, in days from the current date
const AS_OF_RELATIVE_DAYS: Record<string, number> = { yesterday: -1, today: 0, tomorrow: 1 };

// The as-of date a saved filter value names: a YYYY-MM-DD day as is, a relative day resolved against today (UTC, as the
// prices are), and today itself left undefined so the prices default to it
function resolveAsOf(saved: unknown): string | undefined {
  if (typeof saved !== 'string' || !saved) return undefined;
  const offset = AS_OF_RELATIVE_DAYS[saved];
  if (offset === undefined) return saved;
  if (offset === 0) return undefined;
  const day = new Date();
  day.setUTCDate(day.getUTCDate() + offset);
  return day.toISOString().slice(0, 10);
}

@Injectable()
export class LeInventoryItemPricesGatewayService {
  private readonly logger = new Logger(LeInventoryItemPricesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly siteRepository: SiteDomainRepository,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // The legal entity's sites where any supplier has priced the item, as select options
  async findSitesForSelect(
    inventoryItemId: string,
    legalEntityId: string | undefined,
    query: SelectOptionsQueryDto,
  ): Promise<SelectQueryResult> {
    if (!legalEntityId) return { options: [], hasMore: false, totalCount: 0 };
    this.logger.log(`le.inventoryItems.prices.siteIds — inventoryItemId: ${inventoryItemId}`);
    const siteIds = await this.nats.send<string[]>('commerce', 'le.inventoryItems.prices.siteIds', { inventoryItemId });
    return this.siteRepository.findForSelectOptions(legalEntityId, query, siteIds);
  }

  // Every supplier's standing for the item at a site on a day — both picked in the table's context bar, not saved — with
  // the sites the item has prices at and the default among them, which is used when no priced site is asked for
  async findTable(
    inventoryItemId: string,
    legalEntityId: string | undefined,
    userId: string,
    query: InventoryItemPricesTableQueryDto,
  ): Promise<ItemSupplierPriceComparisonTableResponseDto> {
    this.logger.log(`le.inventoryItems.prices.table — inventoryItemId: ${inventoryItemId}`);
    const { state: savedState, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-le-inventory-item-${inventoryItemId}-prices`,
    );
    // The site and day are context, not filters; drop any an older saved state still holds
    const state = {
      ...savedState,
      filters: (savedState.filters ?? []).filter((filter) => filter.field !== 'siteId' && filter.field !== 'asOf'),
    };
    const { siteIds, defaultSiteId } = await this.pricedSites(inventoryItemId, legalEntityId);
    const siteId = query.site && siteIds.includes(query.site) ? query.site : defaultSiteId;
    if (!siteId) return { result: [], count: 0, state, activeViewId, siteIds, defaultSiteId, siteId: null };

    const { result, count } = await this.nats.send<{ result: ItemSupplierPriceComparisonResponseDto[]; count: number }>(
      'commerce',
      'le.inventoryItems.prices.table',
      { inventoryItemId, siteId, asOf: resolveAsOf(query.asOf), ...state },
    );
    return { result, count, state, activeViewId, siteIds, defaultSiteId, siteId };
  }

  // The item's suppliers' prices at the graph's site in its window, per the item's primary unit, from the graph's
  // saved selection; with no site saved yet, the first priced site
  async findGraph(
    inventoryItemId: string,
    legalEntityId: string | undefined,
    userId: string,
  ): Promise<InventoryItemPriceGraphResponseDto> {
    this.logger.log(`le.inventoryItems.prices.graph — inventoryItemId: ${inventoryItemId}`);
    const { state } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-le-inventory-item-${inventoryItemId}-price-graph`,
    );
    const saved = readPriceGraphSelection(state);
    const siteId = saved.siteId ?? (await this.pricedSites(inventoryItemId, legalEntityId)).defaultSiteId;
    const selection = { ...saved, siteId };
    if (!siteId) return { siteId: null, uomSymbol: null, suppliers: [], supplierCount: 0, selection };

    const history = await this.nats.send<InventoryItemPriceHistoryResponseDto>(
      'commerce',
      'le.inventoryItems.prices.findAtSite',
      {
        inventoryItemId,
        siteId,
        from: selection.from,
        to: selection.to,
        supplierIds: selection.supplierIds,
        mrpIds: selection.mrpIds,
      },
    );
    return { ...history, selection };
  }

  // The item's MRPs that supplier prices at a site were agreed against within a window, as select options
  findMrps(
    inventoryItemId: string,
    siteId: string,
    query: InventoryItemPriceOptionsQueryDto,
  ): Promise<SelectQueryResult> {
    this.logger.log(`le.inventoryItems.prices.mrps — inventoryItemId: ${inventoryItemId}, siteId: ${siteId}`);
    return this.nats.send('commerce', 'le.inventoryItems.prices.mrps', { inventoryItemId, siteId, ...query });
  }

  // The suppliers with a price for the item at a site within a window, as select options
  findSuppliers(
    inventoryItemId: string,
    siteId: string,
    query: InventoryItemPriceOptionsQueryDto,
  ): Promise<SelectQueryResult> {
    this.logger.log(`le.inventoryItems.prices.suppliers — inventoryItemId: ${inventoryItemId}, siteId: ${siteId}`);
    return this.nats.send('commerce', 'le.inventoryItems.prices.suppliers', { inventoryItemId, siteId, ...query });
  }

  // The sites where any supplier has priced the item, and the first of them in the site picker's order as the default
  private async pricedSites(
    inventoryItemId: string,
    legalEntityId: string | undefined,
  ): Promise<{ siteIds: string[]; defaultSiteId: string | null }> {
    if (!legalEntityId) return { siteIds: [], defaultSiteId: null };
    const siteIds = await this.nats.send<string[]>('commerce', 'le.inventoryItems.prices.siteIds', { inventoryItemId });
    if (siteIds.length === 0) return { siteIds, defaultSiteId: null };
    const query = Object.assign(new SelectOptionsQueryDto(), { limit: 1 });
    const { options } = await this.siteRepository.findForSelectOptions(legalEntityId, query, siteIds);
    return { siteIds, defaultSiteId: options[0] ? String(options[0].value) : null };
  }
}
