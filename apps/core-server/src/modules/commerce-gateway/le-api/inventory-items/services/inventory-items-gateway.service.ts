import type { CreateSiteStockLevelsDto } from '@commerce/inventory-items/dto/request/create-site-stock-levels.dto';
import type { UpdateSiteStockLevelsDto } from '@commerce/inventory-items/dto/request/update-site-stock-levels.dto';
import type { InventoryItemMrpResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-mrp-response.dto';
import type { InventoryItemMrpTableResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-mrp-table-response.dto';
import type { InventoryItemResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-response.dto';
import type { InventoryItemSiteStockLevelResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-site-stock-level-response.dto';
import type {
  InventoryItemSupplierResponseDto,
  InventoryItemSupplierTableResponseDto,
} from '@commerce/inventory-items/dto/response/inventory-item-supplier-response.dto';
import type { InventoryItemTableResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-table-response.dto';
import type {
  ItemStockBySiteResponseDto,
  SiteStockLevelRowResponseDto,
  SiteStockLevelTableResponseDto,
} from '@commerce/inventory-items/dto/response/site-stock-level-row-response.dto';
import { SiteDomainService } from '@domain/site/services/site.service';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { LegalEntityContextResolverService } from '@/legal-entity-context/legal-entity-context-resolver.service';
import { SiteContextResolverService } from '@/site-context/site-context-resolver.service';

@Injectable()
export class LeInventoryItemsGatewayService {
  private readonly logger = new Logger(LeInventoryItemsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
    private readonly siteContextResolver: SiteContextResolverService,
    private readonly siteService: SiteDomainService,
    private readonly legalEntityContextResolver: LegalEntityContextResolverService,
  ) {}

  // Sets the item's stock levels at one of the legal entity's sites
  async createSiteStockLevels(
    inventoryItemId: string,
    siteId: string,
    dto: CreateSiteStockLevelsDto,
    legalEntityId: string | undefined,
  ): Promise<CreateResponseDto<InventoryItemSiteStockLevelResponseDto>> {
    this.logger.log(
      `le.inventoryItems.siteStockLevels.create — inventoryItemId: ${inventoryItemId}, siteId: ${siteId}`,
    );
    await this.resolveWorkspaceSite(siteId, legalEntityId);
    return this.nats.send('commerce', 'le.inventoryItems.siteStockLevels.create', { inventoryItemId, siteId, ...dto });
  }

  // Updates the item's stock levels at one of the legal entity's sites
  async updateSiteStockLevels(
    inventoryItemId: string,
    siteId: string,
    dto: UpdateSiteStockLevelsDto,
    legalEntityId: string | undefined,
  ): Promise<SuccessResponseDto> {
    this.logger.log(
      `le.inventoryItems.siteStockLevels.update — inventoryItemId: ${inventoryItemId}, siteId: ${siteId}`,
    );
    await this.resolveWorkspaceSite(siteId, legalEntityId);
    return this.nats.send('commerce', 'le.inventoryItems.siteStockLevels.update', { inventoryItemId, siteId, ...dto });
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

  // The item's stock levels at the legal entity's sites, with the stock each holds by location and valued in the legal
  // The legal entity's sites, each with the item's stock levels and its stock there; the user's saved view pages the
  // sites, and commerce resolves the item's stock at them through the legal entity's RLS context and tells which sites
  // the status filter keeps — those whose stock matches, and those with no stock levels when that option is picked
  async findSiteStockLevelsTable(
    inventoryItemId: string,
    userId: string,
    orgId: string,
    legalEntityId: string | undefined,
  ): Promise<SiteStockLevelTableResponseDto> {
    this.logger.log(`le.inventoryItems.siteStockLevels.table — inventoryItemId: ${inventoryItemId}`);
    const leId = LeInventoryItemsGatewayService.requireLegalEntity(legalEntityId);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-le-inventory-item-${inventoryItemId}-site-stock-levels`,
    );
    const stockBySite = await this.nats.send<ItemStockBySiteResponseDto>(
      'commerce',
      'le.inventoryItems.siteStockLevels.bySite',
      { inventoryItemId, filters: state.filters },
    );
    const stockOfSite = new Map(stockBySite.rows.map((stock) => [stock.siteId, stock]));
    const unmatchedSiteIds = stockBySite.rows.filter((stock) => !stock.matchesFilter).map((stock) => stock.siteId);
    const matchedSiteIds = stockBySite.rows.filter((stock) => stock.matchesFilter).map((stock) => stock.siteId);
    const { result: sites, count } = await this.siteService.findForTable(
      orgId,
      leId,
      state,
      stockBySite.sitesWithoutStockLevelsMatch ? { excludeSiteIds: unmatchedSiteIds } : { siteIds: matchedSiteIds },
    );
    const { leCurrencyCode } = await this.legalEntityContextResolver.resolve(leId);

    const result = sites.map((site): SiteStockLevelRowResponseDto => {
      const stock = stockOfSite.get(site.id);
      return {
        siteId: site.id,
        siteName: site.name,
        siteCode: site.code,
        hasStockLevels: Boolean(stock),
        stockLevelId: stock?.id ?? null,
        reorderPoint: stock?.reorderPoint ?? null,
        safetyStock: stock?.safetyStock ?? null,
        maxStockLevel: stock?.maxStockLevel ?? null,
        onHand: stock?.onHand ?? 0,
        stockValue: stock?.stockValue ?? CurrencyAmountDto.from(0n, leCurrencyCode),
        stockStatus: stock?.stockStatus ?? null,
        locations: stock?.locations ?? [],
      };
    });
    return { result, count, state, activeViewId };
  }

  // Removes the item's stock levels at one of the legal entity's sites
  async deleteSiteStockLevels(
    inventoryItemId: string,
    siteId: string,
    legalEntityId: string | undefined,
  ): Promise<SuccessResponseDto> {
    this.logger.log(
      `le.inventoryItems.siteStockLevels.delete — inventoryItemId: ${inventoryItemId}, siteId: ${siteId}`,
    );
    await this.resolveWorkspaceSite(siteId, legalEntityId);
    return this.nats.send('commerce', 'le.inventoryItems.siteStockLevels.delete', { inventoryItemId, siteId });
  }

  // Rejects a site outside the legal entity the user is working in
  private async resolveWorkspaceSite(siteId: string, legalEntityId: string | undefined): Promise<void> {
    const leId = LeInventoryItemsGatewayService.requireLegalEntity(legalEntityId);
    const site = await this.siteContextResolver.resolve(siteId);
    if (site.legalEntityId !== leId) {
      throw new BadRequestException({
        label: 'Site Not In Company',
        detail: 'Items can only be stocked at the sites of the company you are working in.',
      });
    }
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
