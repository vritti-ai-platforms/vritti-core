import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  CursorCodec,
  type FieldMap,
  type FilterCondition,
  FilterProcessor,
  type KeysetOrderBy,
  KeysetProcessor,
  keysetSignature,
  MAX_PAGE_SIZE,
  type SearchState,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SortCondition,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, asc, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import { inventoryItems } from '@/db/schema';
import { InventoryItemDto } from '../dto/entity/inventory-item.dto';
import type { CreateInventoryItemDto } from '../dto/request/create-inventory-item.dto';
import type { UpdateInventoryItemDto } from '../dto/request/update-inventory-item.dto';
import { InventoryItemsDomainRepository } from '../repositories/inventory-items.repository';

interface InventoryItemsFeedQuery {
  filters?: FilterCondition[];
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
    code: { column: inventoryItems.code, type: 'string' },
  };
  private static readonly FILTER_FIELD_MAP: FieldMap = {
    type: { column: inventoryItems.type, type: 'string' },
    tracking: { column: inventoryItems.tracking, type: 'string' },
    categoryId: { column: inventoryItems.categoryId, type: 'string' },
    uomId: { column: inventoryItems.uomId, type: 'string' },
  };

  constructor(private readonly repository: InventoryItemsDomainRepository) {}

  // Returns paginated, filtered, and sorted inventory items for the data table
  async findForTable(state: TableViewState): Promise<{ result: InventoryItemDto[]; count: number }> {
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

    const dtos = rows.map((row) => InventoryItemDto.from(row, row.uomSymbol, true, row.categoryName));

    return { result: dtos, count };
  }

  // Returns paginated inventory items scoped to a single category (for the category detail items table)
  async findForTableByCategory(
    categoryId: string,
    state: TableViewState,
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
      result: rows.map((row) => InventoryItemDto.from(row, row.uomSymbol, true, row.categoryName)),
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

    // Resolve the requested sort to concrete columns; default to createdAt desc when none given,
    // then always append the unique id tie-breaker so the order is total (required for keyset correctness).
    // Each entry carries the row accessor key so cursor values are read by JS property, not DB column name.
    const fieldMap: FieldMap = {
      ...InventoryItemsDomainService.SEARCH_FIELD_MAP,
      ...InventoryItemsDomainService.FILTER_FIELD_MAP,
    };
    const sortEntries: (KeysetOrderBy & { key: string })[] = (query.sort ?? []).flatMap((s) => {
      const def = fieldMap[s.field];
      if (!def || !('column' in def)) return [];
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
    // Bind the cursor to this exact sort so a cursor minted under one sort is rejected (400) if the
    // client changes `sort` mid-pagination, rather than silently applying boundary values to the wrong
    // columns. The feed's sort is user-controlled, so this binding matters here (unlike the fixed feeds).
    const signature = keysetSignature(orderByEntries);

    // When a cursor is present, restrict to rows strictly after the boundary row. decode throws
    // InvalidCursorException (400) on a malformed/forged cursor or a sort mismatch.
    const cursorWhere = query.cursor
      ? KeysetProcessor.buildAfter(orderByEntries, CursorCodec.decode(query.cursor, signature))
      : undefined;
    const where = and(baseWhere, cursorWhere);

    // Clamp defensively in addition to the repository clamp (findKeyset) — one source of truth in MAX_PAGE_SIZE.
    const limit = Math.min(query.limit ?? 20, MAX_PAGE_SIZE);
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
      node: InventoryItemDto.from(row, row.uomSymbol, true, row.categoryName),
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage: hasMore,
        endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
      },
    };
  }

  // Org-wide master list (no site filter). Same table shape as findForTable; RLS scopes to org.
  async findForOrgTable(state: TableViewState): Promise<{ result: InventoryItemDto[]; count: number }> {
    return this.findForTable(state);
  }

  // Items enabled at the current site (inventory_item_sites projection) joined to summed stock.
  async findForSiteTable(state: TableViewState): Promise<{
    result: (InventoryItemDto & { reorderPoint: number; isStocked: boolean; stockedQuantity: string })[];
    count: number;
  }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InventoryItemsDomainService.FILTER_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, InventoryItemsDomainService.SEARCH_FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, {
      ...InventoryItemsDomainService.SEARCH_FIELD_MAP,
      ...InventoryItemsDomainService.FILTER_FIELD_MAP,
    });
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findForSiteTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [desc(inventoryItems.createdAt)],
      limit,
      offset,
    });

    return {
      result: rows.map((row) => ({
        ...InventoryItemDto.from(row, null, true, null),
        reorderPoint: row.reorderPoint,
        isStocked: row.isStocked,
        stockedQuantity: row.stockedQuantity,
      })),
      count,
    };
  }

  // Item × site availability matrix across the given sites (group workspace view).
  findGroupMatrix(siteIds: string[]) {
    return this.repository.findGroupMatrix(siteIds);
  }

  findForSelect(query: SelectOptionsQueryDto, options?: { excludeOnSupplierId?: string }): Promise<SelectQueryResult> {
    return this.repository.findForSelect(
      {
        value: query.valueKey || 'id',
        label: query.labelKey || 'name',
        description: query.descriptionKey,
        additionalKeys: query.additionalKeys,
        groupIdKey: query.groupIdKey,
        search: query.search,
        limit: query.limit,
        offset: query.offset,
        values: query.values,
        excludeIds: query.excludeIds,
        orderByKey: query.orderByKey || 'name',
        orderDirection: query.orderDirection || 'asc',
      },
      options,
    );
  }

  async create(data: CreateInventoryItemDto): Promise<CreateResponseDto<InventoryItemDto>> {
    const entity = await this.repository.create({
      name: data.name,
      code: data.code,
      type: data.type,
      ...(data.tracking ? { tracking: data.tracking } : {}),
      ...(data.pickStrategy ? { pickStrategy: data.pickStrategy } : {}),
      categoryId: data.categoryId,
      taxClassId: data.taxClassId,
      description: data.description ?? null,
      uomId: data.uomId,
      hsnCode: data.hsnCode ?? null,
    });
    const [uomSymbol, categoryName] = await Promise.all([
      this.repository.findUomSymbol(entity.uomId),
      this.repository.findCategoryName(entity.categoryId),
    ]);
    this.logger.log(`Created inventory item: ${entity.name} (${entity.code})`);
    return {
      success: true,
      message: `Inventory item "${entity.name}" (${entity.code}) created successfully.`,
      data: InventoryItemDto.from(entity, uomSymbol, true, categoryName),
    };
  }

  // Returns a single inventory item with UOM symbol and canDelete
  async findById(id: string): Promise<InventoryItemDto> {
    const entity = await this.repository.findByIdWithUomAndCategory(id);
    if (!entity) throw new NotFoundException('Inventory item not found.');
    const referencedIds = await this.repository.findReferencedIds([id]);
    return InventoryItemDto.from(entity, entity.uomSymbol, !referencedIds.has(id), entity.categoryName);
  }

  // Returns the UOM IDs the given item can transact in: primary + per-item conversions + globally derivable family
  async findAllowedUomIds(inventoryItemId: string): Promise<{ name: string; allowedUomIds: string[] }> {
    const entity = await this.repository.findById(inventoryItemId);
    if (!entity) throw new NotFoundException('Inventory item not found.');
    const allowedUomIds = await this.repository.findAllowedUomIds(inventoryItemId);
    return { name: entity.name, allowedUomIds };
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
    this.logger.log(`Updated inventory item: ${updated.name} (${updated.code})`);
    return {
      success: true,
      message: `Inventory item "${updated.name}" updated successfully.`,
    };
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
