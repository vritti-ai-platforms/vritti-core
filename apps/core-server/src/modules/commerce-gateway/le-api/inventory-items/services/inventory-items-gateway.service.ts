import type { BlockSiteItemDto } from '@commerce/inventory-item-sites/dto/request/block-site-item.dto';
import type { ReplenishmentDto } from '@commerce/inventory-item-sites/dto/request/replenishment.dto';
import type { SetSupplierItemsRequiredDto } from '@commerce/inventory-item-sites/dto/request/set-supplier-items-required.dto';
import type { InventoryItemSiteResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-site-response.dto';
import type { InventoryItemMrpResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-mrp-response.dto';
import type { InventoryItemMrpTableResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-mrp-table-response.dto';
import type { InventoryItemResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-response.dto';
import type {
  InventoryItemSupplierResponseDto,
  InventoryItemSupplierTableResponseDto,
} from '@commerce/inventory-items/dto/response/inventory-item-supplier-response.dto';
import type { InventoryItemTableResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-table-response.dto';
import type {
  ItemStockBySiteResponseDto,
  SiteItemRowResponseDto,
  SiteItemTableResponseDto,
} from '@commerce/inventory-items/dto/response/site-item-row-response.dto';
import { SiteDomainService } from '@domain/site/services/site.service';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { LegalEntityContextResolverService } from '@/legal-entity-context/legal-entity-context-resolver.service';

@Injectable()
export class LeInventoryItemsGatewayService {
  private readonly logger = new Logger(LeInventoryItemsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
    private readonly siteService: SiteDomainService,
    private readonly legalEntityContextResolver: LegalEntityContextResolverService,
  ) {}

  // Adds the item to one of the legal entity's sites with how it is replenished there
  addToSite(
    inventoryItemId: string,
    siteId: string,
    dto: ReplenishmentDto,
  ): Promise<CreateResponseDto<InventoryItemSiteResponseDto>> {
    this.logger.log(`le.inventoryItems.sites.create — inventoryItemId: ${inventoryItemId}, siteId: ${siteId}`);
    return this.nats.send('commerce', 'le.inventoryItems.sites.create', { inventoryItemId, siteId, ...dto });
  }

  // Changes how one of the legal entity's sites replenishes the item
  updateReplenishment(inventoryItemId: string, siteId: string, dto: ReplenishmentDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.inventoryItems.sites.update — inventoryItemId: ${inventoryItemId}, siteId: ${siteId}`);
    return this.nats.send('commerce', 'le.inventoryItems.sites.update', { inventoryItemId, siteId, ...dto });
  }

  // Stops one of the legal entity's sites buying the item, with why
  block(inventoryItemId: string, siteId: string, dto: BlockSiteItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.inventoryItems.sites.block — inventoryItemId: ${inventoryItemId}, siteId: ${siteId}`);
    return this.nats.send('commerce', 'le.inventoryItems.sites.block', { inventoryItemId, siteId, ...dto });
  }

  // Lets one of the legal entity's sites buy the item again
  unblock(inventoryItemId: string, siteId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.inventoryItems.sites.unblock — inventoryItemId: ${inventoryItemId}, siteId: ${siteId}`);
    return this.nats.send('commerce', 'le.inventoryItems.sites.unblock', { inventoryItemId, siteId });
  }

  // Ties buying the item at one of the legal entity's sites to the supplier's item set up there, or frees it
  setSupplierItemsRequired(
    inventoryItemId: string,
    siteId: string,
    dto: SetSupplierItemsRequiredDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(
      `le.inventoryItems.sites.setSupplierItemsRequired — inventoryItemId: ${inventoryItemId}, siteId: ${siteId}`,
    );
    return this.nats.send('commerce', 'le.inventoryItems.sites.setSupplierItemsRequired', {
      inventoryItemId,
      siteId,
      ...dto,
    });
  }

  findById(id: string): Promise<InventoryItemResponseDto> {
    this.logger.log(`le.inventoryItems.findById — id: ${id}`);
    return this.nats.send('commerce', 'le.inventoryItems.findById', { id });
  }

  // Returns the organization's master items for the read-only legal-entity table
  async findForTable(userId: string): Promise<InventoryItemTableResponseDto> {
    this.logger.log('le.inventoryItems.table');
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-le-inventory-items');

    const { result, count } = await this.nats.send<{ result: InventoryItemResponseDto[]; count: number }>(
      'commerce',
      'le.inventoryItems.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Returns the MRPs of an item, table-shaped
  async findMrpTable(inventoryItemId: string, userId: string): Promise<InventoryItemMrpTableResponseDto> {
    this.logger.log(`le.inventoryItems.mrp.table — inventoryItemId: ${inventoryItemId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-le-inventory-item-${inventoryItemId}-mrp`,
    );
    const { result, count } = await this.nats.send<{ result: InventoryItemMrpResponseDto[]; count: number }>(
      'commerce',
      'le.inventoryItems.mrp.table',
      { inventoryItemId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  async findSuppliersTable(inventoryItemId: string, userId: string): Promise<InventoryItemSupplierTableResponseDto> {
    this.logger.log(`le.inventoryItems.suppliers.table — inventoryItemId: ${inventoryItemId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-le-inventory-item-${inventoryItemId}-suppliers`,
    );
    const { result, count } = await this.nats.send<{ result: InventoryItemSupplierResponseDto[]; count: number }>(
      'commerce',
      'le.inventoryItems.suppliers.table',
      { inventoryItemId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // The legal entity's sites, each with how it carries the item and its stock there; the user's saved view pages the
  // sites, and commerce resolves the item's stock at them through the legal entity's RLS context and tells which sites
  // the status filter keeps — those whose stock matches, and those that do not carry the item when that option is picked
  async findSiteItemsTable(
    inventoryItemId: string,
    userId: string,
    orgId: string,
    legalEntityId: string | undefined,
  ): Promise<SiteItemTableResponseDto> {
    this.logger.log(`le.inventoryItems.sites.table — inventoryItemId: ${inventoryItemId}`);
    const leId = LeInventoryItemsGatewayService.requireLegalEntity(legalEntityId);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-le-inventory-item-${inventoryItemId}-sites`,
    );
    const stockBySite = await this.nats.send<ItemStockBySiteResponseDto>('commerce', 'le.inventoryItems.sites.bySite', {
      inventoryItemId,
      filters: state.filters,
    });
    const stockOfSite = new Map(stockBySite.rows.map((stock) => [stock.siteId, stock]));
    const unmatchedSiteIds = stockBySite.rows.filter((stock) => !stock.matchesFilter).map((stock) => stock.siteId);
    const matchedSiteIds = stockBySite.rows.filter((stock) => stock.matchesFilter).map((stock) => stock.siteId);
    const { result: sites, count } = await this.siteService.findForTable(
      orgId,
      leId,
      state,
      stockBySite.sitesNotCarryingMatch ? { excludeSiteIds: unmatchedSiteIds } : { siteIds: matchedSiteIds },
    );
    const { leCurrencyCode } = await this.legalEntityContextResolver.resolve(leId);

    const result = sites.map((site): SiteItemRowResponseDto => {
      const stock = stockOfSite.get(site.id);
      return {
        siteId: site.id,
        siteName: site.name,
        siteCode: site.code,
        atSite: Boolean(stock),
        siteItemId: stock?.id ?? null,
        siteItemStatus: stock?.status ?? null,
        blockedReason: stock?.blockedReason ?? null,
        replenishment: stock?.replenishment ?? null,
        reorderPoint: stock?.reorderPoint ?? null,
        safetyStock: stock?.safetyStock ?? null,
        maxStock: stock?.maxStock ?? null,
        supplierItemsRequired: stock?.supplierItemsRequired ?? false,
        onHand: stock?.onHand ?? 0,
        stockValue: stock?.stockValue ?? CurrencyAmountDto.from(0n, leCurrencyCode),
        stockStatus: stock?.stockStatus ?? null,
        locations: stock?.locations ?? [],
        display: stock?.display ?? { onHand: null, safetyStock: null, reorderPoint: null, maxStock: null },
      };
    });
    return { result, count, state, activeViewId };
  }

  // Removes the item from one of the legal entity's sites
  removeFromSite(inventoryItemId: string, siteId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.inventoryItems.sites.delete — inventoryItemId: ${inventoryItemId}, siteId: ${siteId}`);
    return this.nats.send('commerce', 'le.inventoryItems.sites.delete', { inventoryItemId, siteId });
  }

  // Returns the session legal entity, rejecting requests made outside a legal entity workspace
  private static requireLegalEntity(legalEntityId: string | undefined): string {
    if (legalEntityId) return legalEntityId;
    throw new BadRequestException({
      label: 'Missing Legal Entity Context',
      detail: 'A legal entity workspace is required to manage the sites of an item.',
    });
  }
}
