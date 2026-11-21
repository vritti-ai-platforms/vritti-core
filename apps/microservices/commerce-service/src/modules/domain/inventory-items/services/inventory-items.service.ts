import { Injectable, Logger } from '@nestjs/common';
import {
  compareMoney,
  type FieldMap,
  FilterOperators,
  FilterProcessor,
  type SearchState,
  type SortCondition,
} from '@vritti/api-sdk/conditions';
import {
  CursorCodec,
  type KeysetOrderBy,
  KeysetProcessor,
  keysetSignature,
  type TableFilters,
  type TableState,
} from '@vritti/api-sdk/data-table';
import { and, asc, Column, desc, eq, is, not } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { CurrencyAmountDto, type CurrencyCode } from '@vritti/api-sdk/money';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type SelectOptionsQueryDto, type SelectQueryResult, selectPageOptions } from '@vritti/api-sdk/select';
import { inventoryItems, SiteItemStatusValues, siteStockStatusMatchesSql, siteStockValue } from '@/db/schema';
import { InventoryItemDto } from '../dto/entity/inventory-item.dto';
import { LegalEntityInventoryItemCountsDto } from '../dto/entity/legal-entity-inventory-item-counts.dto';
import { OrgInventoryItemCountsDto } from '../dto/entity/org-inventory-item-counts.dto';
import type { SiteStockTableItemDto } from '../dto/entity/scoped-inventory-item.dto';
import { SiteInventoryItemCountsDto } from '../dto/entity/site-inventory-item-counts.dto';
import type { CreateInventoryItemDto } from '../dto/request/create-inventory-item.dto';
import type { UpdateInventoryItemDto } from '../dto/request/update-inventory-item.dto';
import {
  carriedAtSitesSql,
  InventoryItemsDomainRepository,
  stockHeldUnderLocationsSql,
} from '../repositories/inventory-items.repository';

interface InventoryItemsFeedQuery {
  filters: TableFilters;
  search?: SearchState | null;
  sort?: SortCondition[];
  limit?: number;
  cursor?: string;
}

@Injectable()
export class InventoryItemsDomainService {
  private readonly logger = new Logger(InventoryItemsDomainService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    name: { column: inventoryItems.name, type: 'string' },
    sku: { column: inventoryItems.sku, type: 'string' },
  };
  private static readonly FILTER_FIELD_MAP: FieldMap = {
    type: { column: inventoryItems.type, type: 'string' },
    tracking: { column: inventoryItems.tracking, type: 'string' },
    categoryId: { column: inventoryItems.categoryId, type: 'string' },
    uomId: { column: inventoryItems.uomId, type: 'string' },
  };

  // The site stock table's filters: the stock status, and the locations holding the stock, a picked
  // location including everything below it
  private static readonly SITE_FILTER_FIELD_MAP: FieldMap = {
    ...InventoryItemsDomainService.FILTER_FIELD_MAP,
    stockStatus: {
      multiExpression: (values, operator) => {
        const matches = siteStockStatusMatchesSql(values);
        return operator === FilterOperators.IS_NOT_ANY_OF ? not(matches) : matches;
      },
      type: 'string',
    },
    locationId: {
      multiExpression: (values, operator) => {
        const held = stockHeldUnderLocationsSql(values.map(String));
        return operator === FilterOperators.IS_NOT_ANY_OF ? not(held) : held;
      },
      type: 'string',
    },
  };

  // The legal entity's master-item filters: the sites carrying the item
  private static readonly LE_FILTER_FIELD_MAP: FieldMap = {
    ...InventoryItemsDomainService.FILTER_FIELD_MAP,
    siteId: {
      multiExpression: (values, operator) => {
        const carried = carriedAtSitesSql(values.map(String));
        return operator === FilterOperators.IS_NOT_ANY_OF ? not(carried) : carried;
      },
      type: 'string',
    },
  };

  constructor(private readonly repository: InventoryItemsDomainRepository) {}

  async create(data: CreateInventoryItemDto): Promise<CreateResponseDto<{ id: string; sku: string }>> {
    const entity = await this.repository.create({
      name: data.name,
      sku: data.sku,
      type: data.type,
      ...(data.tracking ? { tracking: data.tracking } : {}),
      ...(data.pickStrategy ? { pickStrategy: data.pickStrategy } : {}),
      categoryId: data.categoryId,
      description: data.description,
      uomId: data.uomId,
      displayUomId: data.uomId,
      hsnCode: data.hsnCode,
      taxClassId: data.taxClassId,
    });
    this.logger.log(`Created inventory item: ${entity.name} (${entity.sku})`);
    return {
      success: true,
      message: `Inventory item "${entity.name}" (${entity.sku}) created successfully.`,
      data: { id: entity.id, sku: entity.sku },
    };
  }

  // Updates an inventory item. Tracking is set at creation and cannot be changed; a display unit left on the primary unit
  // follows it when the primary unit changes, and any other must be one of the units the item transacts in
  async update(id: string, data: Omit<UpdateInventoryItemDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Inventory item not found.');
    const uomId = data.uomId ?? existing.uomId;
    const displayUomId =
      data.displayUomId ?? (existing.displayUomId === existing.uomId ? uomId : existing.displayUomId);

    if (data.uomId && data.uomId !== existing.uomId) {
      const refs = await this.repository.countReferences(id);
      if (refs.purchaseOrderItems > 0 || refs.stockAdjustments > 0 || refs.stockTransfers > 0) {
        throw new BadRequestException({
          label: 'UOM Locked',
          detail: 'Primary UOM cannot be changed after the item has transaction history.',
        });
      }
    }

    if (displayUomId !== uomId && (displayUomId !== existing.displayUomId || uomId !== existing.uomId)) {
      const allowedUomIds = await this.repository.findAllowedUomIdsFor(id, uomId);
      if (!allowedUomIds.includes(displayUomId)) {
        throw new BadRequestException({
          label: 'Unit Not Allowed',
          detail: "The display unit must be the item's primary unit or one it converts to.",
          errors: [{ field: 'displayUomId', message: "Not one of the item's units" }],
        });
      }
    }

    const updated = await this.repository.update(id, { ...data, displayUomId });
    this.logger.log(`Updated inventory item: ${updated.name} (${updated.sku})`);
    return {
      success: true,
      message: `Inventory item "${updated.name}" updated successfully.`,
    };
  }

  // Returns a single inventory item with UOM symbol and canDelete
  async findById(id: string): Promise<InventoryItemDto> {
    const entity = await this.repository.findByIdWithUomAndCategory(id);
    if (!entity) throw new NotFoundException('Inventory item not found.');
    const referencedIds = await this.repository.findReferencedIds([id]);
    return InventoryItemDto.from(entity, !referencedIds.has(id));
  }

  // Returns paginated, filtered, and sorted inventory items for the data table
  findForTable(state: TableState): Promise<{ result: InventoryItemDto[]; count: number }> {
    return this.findMasterTable(state, InventoryItemsDomainService.FILTER_FIELD_MAP);
  }

  // Returns paginated inventory items scoped to a single category (for the category detail items table)
  async findForTableByCategory(
    categoryId: string,
    state: TableState,
  ): Promise<{ result: InventoryItemDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InventoryItemsDomainService.FILTER_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, InventoryItemsDomainService.SEARCH_FIELD_MAP);
    const where = and(eq(inventoryItems.categoryId, categoryId), filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, {
      ...InventoryItemsDomainService.SEARCH_FIELD_MAP,
      ...InventoryItemsDomainService.FILTER_FIELD_MAP,
    });
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllWithUom({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [desc(inventoryItems.createdAt)],
      limit,
      offset,
    });

    return {
      result: rows.map((row) => InventoryItemDto.from(row)),
      count,
    };
  }

  // Org-wide master list (no site filter). Same table shape as findForTable; RLS scopes to org.
  async findForOrgTable(state: TableState): Promise<{ result: InventoryItemDto[]; count: number }> {
    return this.findForTable(state);
  }

  // The master list a legal entity reads, narrowed to the items a picked site carries
  findForLegalEntityTable(state: TableState): Promise<{ result: InventoryItemDto[]; count: number }> {
    return this.findMasterTable(state, InventoryItemsDomainService.LE_FILTER_FIELD_MAP);
  }

  // Every master item with how the site carries it, the stock it holds by location, its value in the site's currency,
  // where that stock sits against the levels and the ratios to its display unit; RLS narrows everything to the request's
  // site
  async findForSiteStockTable(
    state: TableState,
    leCurrencyCode: CurrencyCode,
  ): Promise<{ result: SiteStockTableItemDto[]; count: number }> {
    const filterFields: FieldMap = {
      ...InventoryItemsDomainService.SITE_FILTER_FIELD_MAP,
      stockValue: { moneyExpression: compareMoney(siteStockValue, leCurrencyCode), type: 'number' },
    };
    const orderBy = FilterProcessor.buildOrderBy(state.sort, {
      ...InventoryItemsDomainService.SEARCH_FIELD_MAP,
      ...InventoryItemsDomainService.FILTER_FIELD_MAP,
    });
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForSiteStockTable({
      where: and(
        FilterProcessor.buildWhere(state.filters, filterFields),
        FilterProcessor.buildSearch(state.search, InventoryItemsDomainService.SEARCH_FIELD_MAP),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [desc(inventoryItems.createdAt)],
      limit,
      offset,
    });

    return {
      result: result.map((row) => ({
        ...InventoryItemDto.from(row),
        atSite: row.atSite,
        siteItemStatus: row.siteItemStatus,
        blockedReason: row.blockedReason,
        replenishment: row.replenishment,
        reorderPoint: row.reorderPoint,
        safetyStock: row.safetyStock,
        maxStock: row.maxStock,
        onHand: row.onHand,
        stockValue: CurrencyAmountDto.from(row.stockValue, leCurrencyCode),
        stockStatus: row.stockStatus,
        locations: row.locations,
        displayUnitRatios: row.displayUnitRatios,
      })),
      count,
    };
  }

  // Counts an inventory item's UOM conversions, MRPs and suppliers, one per tab of the org's detail page
  async findOrgCounts(id: string): Promise<OrgInventoryItemCountsDto> {
    return OrgInventoryItemCountsDto.from(await this.repository.findOrgCountsOrThrow(id));
  }

  // Counts an inventory item's suppliers and MRPs, one per tab of a legal entity's detail page
  async findLegalEntityCounts(id: string): Promise<LegalEntityInventoryItemCountsDto> {
    return LegalEntityInventoryItemCountsDto.from(await this.repository.findLegalEntityCountsOrThrow(id));
  }

  // Counts the rows each tab of a site's inventory item detail page lists
  async findSiteCounts(id: string): Promise<SiteInventoryItemCountsDto> {
    return SiteInventoryItemCountsDto.from(await this.repository.findSiteCountsOrThrow(id));
  }

  // Returns a keyset/cursor Relay connection of inventory items for infinite feeds (mobile / GraphQL).
  async findForFeed(query: InventoryItemsFeedQuery): Promise<{
    edges: { cursor: string; node: InventoryItemDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    const filterWhere = FilterProcessor.buildWhere(query.filters, InventoryItemsDomainService.FILTER_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(query.search, InventoryItemsDomainService.SEARCH_FIELD_MAP);
    const baseWhere = and(filterWhere, searchWhere);

    const fieldMap: FieldMap = {
      ...InventoryItemsDomainService.SEARCH_FIELD_MAP,
      ...InventoryItemsDomainService.FILTER_FIELD_MAP,
    };
    const sortEntries: (KeysetOrderBy & { key: string })[] = (query.sort ?? []).flatMap((s) => {
      const def = fieldMap[s.field];
      // A keyset cursor reads a real column's value, so only plain columns can be sort keys here
      if (!def || !('column' in def) || !is(def.column, Column)) return [];
      return [{ column: def.column, direction: s.direction, key: s.field }];
    });
    const orderByEntries: (KeysetOrderBy & { key: string })[] =
      sortEntries.length > 0
        ? [...sortEntries, { column: inventoryItems.id, direction: 'asc', key: 'id' }]
        : [
            {
              column: inventoryItems.createdAt,
              direction: 'desc',
              key: 'createdAt',
            },
            { column: inventoryItems.id, direction: 'asc', key: 'id' },
          ];
    const orderBy = orderByEntries.map((e) => (e.direction === 'asc' ? asc(e.column) : desc(e.column)));
    const signature = keysetSignature(orderByEntries);

    const cursorWhere = query.cursor
      ? KeysetProcessor.buildAfter(orderByEntries, CursorCodec.decode(query.cursor, signature))
      : undefined;
    const where = and(baseWhere, cursorWhere);

    const limit = query.limit ?? 20;
    const { rows, hasMore } = await this.repository.findKeysetWithUom({
      where: where || undefined,
      orderBy,
      limit,
    });

    // One opaque keyset cursor per row (Relay edge cursor); values read by JS accessor key.
    const edges = rows.map((row) => ({
      cursor: CursorCodec.encode(
        orderByEntries.map((e) => (row as Record<string, unknown>)[e.key]),
        signature,
      ),
      node: InventoryItemDto.from(row),
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage: hasMore,
        endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
      },
    };
  }

  async findForSelect(
    query: SelectOptionsQueryDto,
    options?: {
      excludeOnSupplierId?: string;
      // Only the items the site does not carry yet
      notAtSiteId?: string;
      notOnPurchaseId?: string;
      categoryIds?: string[];
      // Only the items the site carries, each with its stock and levels there; one whose purchasing the site has blocked
      // comes disabled
      atSite?: { siteId: string; stockStatus?: string[]; leCurrencyCode: CurrencyCode };
      // At the site, marks the items the supplier supplies there and leaves out the ones its rules keep from it
      supplier?: { supplierId: string; siteRequires: boolean };
    },
  ): Promise<SelectQueryResult> {
    const { atSite, ...filters } = options ?? {};
    const result = await this.repository.findForSelect(
      {
        ...selectPageOptions(query),
        value: query.valueKey || 'id',
        label: query.labelKey || 'name',
        description: query.descriptionKey,
        additionalKeys: query.additionalKeys,
        groupIdKey: query.groupIdKey,
        orderByKey: query.orderByKey || 'name',
        orderDirection: query.orderDirection || 'asc',
      },
      { ...filters, atSiteId: atSite?.siteId, stockStatus: atSite?.stockStatus },
    );
    if (!atSite) return result;

    // The stock's value comes in minor units of the legal entity's currency and goes out as an amount in it
    return {
      ...result,
      options: result.options.map((option) => ({
        ...option,
        disabled: option.additionals?.siteItemStatus === SiteItemStatusValues.BLOCKED,
        additionals: {
          ...option.additionals,
          stockValue: CurrencyAmountDto.from(BigInt(String(option.additionals?.stockValue)), atSite.leCurrencyCode),
        },
      })),
    };
  }

  // Returns the UOM IDs the given item can transact in: primary + per-item conversions + globally derivable family
  async findAllowedUomIds(
    inventoryItemId: string,
  ): Promise<{ name: string; uomId: string; displayUomId: string; allowedUomIds: string[] }> {
    const entity = await this.repository.findById(inventoryItemId);
    if (!entity) throw new NotFoundException('Inventory item not found.');
    const allowedUomIds = await this.repository.findAllowedUomIds(inventoryItemId);
    return { name: entity.name, uomId: entity.uomId, displayUomId: entity.displayUomId, allowedUomIds };
  }

  // Deletes an inventory item; throws ConflictException if referenced
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Inventory item not found.');

    const refs = await this.repository.countReferences(id);
    const refLabels: [number, string][] = [
      [refs.stockAdjustments, 'stock adjustment'],
      [refs.stockTransfers, 'stock transfer'],
      [refs.purchaseOrderItems, 'purchase order item'],
    ];
    const parts = refLabels.filter(([n]) => n > 0).map(([n, label]) => `${n} ${pluralize(label, n)}`);
    if (parts.length > 0) {
      throw new ConflictException({
        label: 'Inventory Item In Use',
        detail: `Cannot delete "${existing.name}" — it is referenced by ${parts.join(', ')}. Remove those references first.`,
      });
    }

    await this.repository.delete(id);
    this.logger.log(`Deleted inventory item: ${existing.name} (${id})`);
    return {
      success: true,
      message: `Inventory item "${existing.name}" deleted successfully.`,
    };
  }

  // Returns paginated, filtered, and sorted master items, filtered through the scope's fields
  private async findMasterTable(
    state: TableState,
    filterFields: FieldMap,
  ): Promise<{ result: InventoryItemDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, filterFields);
    const searchWhere = FilterProcessor.buildSearch(state.search, InventoryItemsDomainService.SEARCH_FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, {
      ...InventoryItemsDomainService.SEARCH_FIELD_MAP,
      ...InventoryItemsDomainService.FILTER_FIELD_MAP,
    });
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllWithUom({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(inventoryItems.createdAt)],
      limit,
      offset,
    });

    const dtos = rows.map((row) => InventoryItemDto.from(row));

    return { result: dtos, count };
  }
}
