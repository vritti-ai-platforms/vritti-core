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
import { inventoryItems, siteStockStatusMatchesSql, siteStockValue } from '@/db/schema';
import { InventoryItemDto } from '../dto/entity/inventory-item.dto';
import type { SiteStockTableItemDto } from '../dto/entity/scoped-inventory-item.dto';
import type { CreateInventoryItemDto } from '../dto/request/create-inventory-item.dto';
import type { UpdateInventoryItemDto } from '../dto/request/update-inventory-item.dto';
import { InventoryItemsDomainRepository, stockHeldUnderLocationsSql } from '../repositories/inventory-items.repository';

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

  constructor(private readonly repository: InventoryItemsDomainRepository) {}

  async create(data: CreateInventoryItemDto): Promise<CreateResponseDto<InventoryItemDto>> {
    const entity = await this.repository.create({
      name: data.name,
      sku: data.sku,
      type: data.type,
      ...(data.tracking ? { tracking: data.tracking } : {}),
      ...(data.pickStrategy ? { pickStrategy: data.pickStrategy } : {}),
      categoryId: data.categoryId,
      description: data.description ?? null,
      uomId: data.uomId,
      hsnCode: data.hsnCode ?? null,
      taxClassId: data.taxClassId,
    });
    const [uomSymbol, categoryName, taxClassName] = await Promise.all([
      this.repository.findUomSymbol(entity.uomId),
      this.repository.findCategoryName(entity.categoryId),
      this.repository.findTaxClassName(entity.taxClassId),
    ]);
    this.logger.log(`Created inventory item: ${entity.name} (${entity.sku})`);
    return {
      success: true,
      message: `Inventory item "${entity.name}" (${entity.sku}) created successfully.`,
      data: InventoryItemDto.from(entity, uomSymbol, true, categoryName, taxClassName),
    };
  }

  // Updates an inventory item. Tracking is set at creation and cannot be changed.
  async update(id: string, data: Omit<UpdateInventoryItemDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Inventory item not found.');

    if (data.uomId && data.uomId !== existing.uomId) {
      const refs = await this.repository.countReferences(id);
      if (refs.purchaseOrderItems > 0 || refs.stockAdjustments > 0 || refs.stockTransfers > 0) {
        throw new BadRequestException({
          label: 'UOM Locked',
          detail: 'Primary UOM cannot be changed after the item has transaction history.',
        });
      }
    }

    const updated = await this.repository.update(id, data);
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
    return InventoryItemDto.from(
      entity,
      entity.uomSymbol,
      !referencedIds.has(id),
      entity.categoryName,
      entity.taxClassName,
    );
  }

  // Returns paginated, filtered, and sorted inventory items for the data table
  async findForTable(state: TableState): Promise<{ result: InventoryItemDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InventoryItemsDomainService.FILTER_FIELD_MAP);
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

    const dtos = rows.map((row) => InventoryItemDto.from(row, row.uomSymbol, true, row.categoryName, row.taxClassName));

    return { result: dtos, count };
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
      result: rows.map((row) => InventoryItemDto.from(row, row.uomSymbol, true, row.categoryName, row.taxClassName)),
      count,
    };
  }

  // Org-wide master list (no site filter). Same table shape as findForTable; RLS scopes to org.
  async findForOrgTable(state: TableState): Promise<{ result: InventoryItemDto[]; count: number }> {
    return this.findForTable(state);
  }

  // Every master item with the site's stock levels for it, the stock it holds by location, its value in the site's
  // currency and where that stock sits against the levels; RLS narrows everything to the request's site
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
        ...InventoryItemDto.from(row, row.uomSymbol, true, row.categoryName, row.taxClassName),
        hasStockLevels: row.hasStockLevels,
        reorderPoint: row.reorderPoint,
        safetyStock: row.safetyStock,
        maxStockLevel: row.maxStockLevel,
        onHand: row.onHand,
        stockValue: CurrencyAmountDto.from(row.stockValue, leCurrencyCode),
        stockStatus: row.stockStatus,
        locations: row.locations,
      })),
      count,
    };
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
      node: InventoryItemDto.from(row, row.uomSymbol, true, row.categoryName, row.taxClassName),
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
      withoutStockLevels?: boolean;
      categoryIds?: string[];
      // Only the items with stock levels at the site, each with its stock and levels there
      stockLevelsAt?: { siteId: string; stockStatus?: string[]; leCurrencyCode: CurrencyCode };
    },
  ): Promise<SelectQueryResult> {
    const { stockLevelsAt, ...filters } = options ?? {};
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
      { ...filters, stockLevelsAtSiteId: stockLevelsAt?.siteId, stockStatus: stockLevelsAt?.stockStatus },
    );
    if (!stockLevelsAt) return result;

    // The stock's value comes in minor units of the legal entity's currency and goes out as an amount in it
    return {
      ...result,
      options: result.options.map((option) => ({
        ...option,
        additionals: {
          ...option.additionals,
          stockValue: CurrencyAmountDto.from(
            BigInt(String(option.additionals?.stockValue)),
            stockLevelsAt.leCurrencyCode,
          ),
        },
      })),
    };
  }

  // Returns the UOM IDs the given item can transact in: primary + per-item conversions + globally derivable family
  async findAllowedUomIds(inventoryItemId: string): Promise<{ name: string; allowedUomIds: string[] }> {
    const entity = await this.repository.findById(inventoryItemId);
    if (!entity) throw new NotFoundException('Inventory item not found.');
    const allowedUomIds = await this.repository.findAllowedUomIds(inventoryItemId);
    return { name: entity.name, allowedUomIds };
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
}
