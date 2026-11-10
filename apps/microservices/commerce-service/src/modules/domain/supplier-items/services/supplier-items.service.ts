import {
  InventoryItemSupplierDto,
  SupplierItemDetailDto,
  SupplierItemDto,
} from '@domain/suppliers/dto/entity/supplier.dto';
import { Injectable } from '@nestjs/common';
import { type FieldMap, FilterOperators, FilterProcessor } from '@vritti/api-sdk/conditions';
import { CursorCodec, type KeysetOrderBy, KeysetProcessor, type TableState } from '@vritti/api-sdk/data-table';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, desc, eq, inArray, sql } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/select';
import {
  inventoryItems,
  type NewSupplierItem,
  type NewSupplierSiteItem,
  parties,
  type Supplier,
  type SupplierSiteItem,
  supplierItems,
  supplierSiteItems,
  suppliers,
  uom,
} from '@/db/schema';
import { SupplierSiteItemDto } from '../dto/entity/supplier-site-item.dto';
import { SupplierSiteItemDetailDto } from '../dto/entity/supplier-site-item-detail.dto';
import { SupplierSiteItemRowDto } from '../dto/entity/supplier-site-item-row.dto';
import type { AddSupplierItemDto } from '../dto/request/add-supplier-item.dto';
import type { AddSupplierSiteItemDto } from '../dto/request/add-supplier-site-item.dto';
import type { BulkSetSupplierItemDefaultLeadTimeDto } from '../dto/request/bulk-set-supplier-item-default-lead-time.dto';
import type { BulkSetSupplierItemMinOrderDto } from '../dto/request/bulk-set-supplier-item-min-order.dto';
import type { BulkSetSupplierSiteItemPreferredDto } from '../dto/request/bulk-set-supplier-site-item-preferred.dto';
import type { UpdateSupplierItemDto } from '../dto/request/update-supplier-item.dto';
import type { UpdateSupplierSiteItemDto } from '../dto/request/update-supplier-site-item.dto';
import { SupplierItemsDomainRepository } from '../repositories/supplier-items.repository';

// An item and unit a quotation prices for a supplier, before it is resolved to the supplier's item
export interface QuotedItem {
  supplierId: string;
  inventoryItemId: string;
  uomId: string;
  supplierItemCode: string | null;
}

@Injectable()
export class SupplierItemsDomainService {
  // Field map for the supplier-rooted "items linked to this supplier" view (joins inventory_items + uom)
  private static readonly FIELD_MAP: FieldMap = {
    inventoryItemName: { column: inventoryItems.name, type: 'string' },
    supplierItemCode: { column: supplierItems.supplierItemCode, type: 'string' },
    uomSymbol: { column: uom.symbol, type: 'string' },
  };

  // Field map for a supplier's items table: the item's own terms, plus the sites it is set up at
  private static readonly ITEM_FIELD_MAP: FieldMap = {
    ...SupplierItemsDomainService.FIELD_MAP,
    defaultLeadTimeDays: { column: supplierItems.defaultLeadTimeDays, type: 'number' },
    minOrderQuantity: { column: supplierItems.minOrderQuantity, type: 'number' },
    sites: {
      multiExpression: (values, operator) => {
        const atSites = sql`EXISTS (SELECT 1 FROM ${supplierSiteItems} WHERE ${supplierSiteItems.supplierItemId} = ${supplierItems.id} AND ${inArray(supplierSiteItems.siteId, values)})`;
        return operator === FilterOperators.IS_NOT_ANY_OF ? sql`NOT ${atSites}` : atSites;
      },
      type: 'string',
    },
    isPreferred: {
      expression: (value, operator) => {
        const preferredSomewhere = sql`EXISTS (SELECT 1 FROM ${supplierSiteItems} WHERE ${supplierSiteItems.supplierItemId} = ${supplierItems.id} AND ${supplierSiteItems.isPreferred})`;
        const wantPreferred = (String(value) === 'true') !== (operator === FilterOperators.NOT_EQUALS);
        return wantPreferred ? preferredSomewhere : sql`NOT ${preferredSomewhere}`;
      },
      type: 'boolean',
    },
  };

  // Field map for the site's view of a supplier's items (adds the joined supplier_site_items row)
  private static readonly SITE_ITEM_FIELD_MAP: FieldMap = {
    ...SupplierItemsDomainService.FIELD_MAP,
    leadTimeDays: { column: supplierSiteItems.leadTimeDays, type: 'number' },
    minOrderQuantity: { column: supplierItems.minOrderQuantity, type: 'number' },
    isPreferred: { column: supplierSiteItems.isPreferred, type: 'boolean' },
  };

  // Field map for the inventory-item-rooted "suppliers carrying this item" view (joins suppliers + uom)
  private static readonly SUPPLIERS_FOR_ITEM_FIELD_MAP: FieldMap = {
    supplierName: { column: parties.displayName, type: 'string' },
    supplierCode: { column: suppliers.code, type: 'string' },
    supplierItemCode: { column: supplierItems.supplierItemCode, type: 'string' },
    uomSymbol: { column: uom.symbol, type: 'string' },
    minOrderQuantity: { column: supplierItems.minOrderQuantity, type: 'number' },
    leadTimeDays: { column: supplierSiteItems.leadTimeDays, type: 'number' },
    isPreferred: { column: supplierSiteItems.isPreferred, type: 'boolean' },
  };

  // Field map for the supplier item's site items table
  private static readonly SITE_ITEMS_OF_ITEM_FIELD_MAP: FieldMap = {
    isPreferred: { column: supplierSiteItems.isPreferred, type: 'boolean' },
    leadTimeDays: { column: supplierSiteItems.leadTimeDays, type: 'number' },
  };

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly repository: SupplierItemsDomainRepository,
  ) {}

  // Returns paginated supplier item options for select dropdowns and filters.
  findForSelect(
    query: SelectOptionsQueryDto,
    options?: {
      supplierId?: string;
      siteId?: string | null;
      purchaseOrderId?: string;
      excludeOnGoodsReceiptId?: string;
    },
  ): Promise<SelectQueryResult> {
    return this.repository.findForSelect(
      {
        value: query.valueKey || 'id',
        label: query.labelKey || 'name',
        description: query.descriptionKey,
        additionalKeys: query.additionalKeys,
        groupIdKey: query.groupIdKey || 'categoryId',
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

  // Returns paginated supplier items for a supplier
  async findForTable(supplierId: string, state: TableState): Promise<{ result: SupplierItemDto[]; count: number }> {
    await this.requireSupplier(supplierId);
    const { result, count } = await this.repository.findItemsForTable(
      supplierId,
      SupplierItemsDomainService.tableOptions(state, SupplierItemsDomainService.ITEM_FIELD_MAP),
    );
    return { result: result.map((row) => SupplierItemDto.from(row, row.inventoryItemName, row.uomSymbol)), count };
  }

  // Returns paginated supplier items carried by an enrolled site with that site's terms and price in force; a site
  // not yet enrolled sees the supplier's whole catalog with no site terms
  async findSiteItemsAtSiteForTable(
    supplierId: string,
    siteId: string,
    state: TableState,
  ): Promise<{ result: SupplierSiteItemRowDto[]; count: number }> {
    await this.requireSupplier(supplierId);
    const enrolled = (await this.repository.findEnrolledSiteIds(supplierId)).includes(siteId);
    const { result, count } = await this.repository.findSiteItemsAtSiteForTable(
      supplierId,
      siteId,
      SupplierItemsDomainService.tableOptions(state, SupplierItemsDomainService.SITE_ITEM_FIELD_MAP),
      { carriedOnly: enrolled },
    );
    return {
      result: result.map((row) => SupplierSiteItemRowDto.fromSite(row, row.inventoryItemName, row.uomSymbol)),
      count,
    };
  }

  // Returns paginated suppliers carrying an inventory item with a site's terms; no site leaves them empty
  async findSuppliersForItem(
    inventoryItemId: string,
    siteId: string | null,
    state: TableState,
  ): Promise<{ result: InventoryItemSupplierDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(
      state.filters,
      SupplierItemsDomainService.SUPPLIERS_FOR_ITEM_FIELD_MAP,
    );
    const searchWhere = FilterProcessor.buildSearch(
      state.search,
      SupplierItemsDomainService.SUPPLIERS_FOR_ITEM_FIELD_MAP,
    );
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, SupplierItemsDomainService.SUPPLIERS_FOR_ITEM_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findSuppliersForItem(inventoryItemId, siteId, {
      where: where || undefined,
      orderBy,
      limit,
      offset,
    });

    return {
      result: result.map((row) =>
        InventoryItemSupplierDto.from(row, row.supplierName, row.supplierCode, row.uomSymbol),
      ),
      count,
    };
  }

  // Keyset feed of an item's supplier links, preferred at the site first
  async findSuppliersFeed(
    inventoryItemId: string,
    siteId: string | null,
    limit: number,
    cursor?: string,
  ): Promise<{
    edges: { cursor: string; node: InventoryItemSupplierDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    const orderByEntries: (KeysetOrderBy & { key: string })[] = [
      { column: supplierSiteItems.isPreferred, direction: 'desc', nulls: 'last', key: 'siteIsPreferred' },
      { column: supplierItems.createdAt, direction: 'desc', key: 'createdAt' },
      { column: supplierItems.id, direction: 'asc', key: 'id' },
    ];
    const orderBy = orderByEntries.map((e) => (e.direction === 'asc' ? asc(e.column) : desc(e.column)));
    const cursorWhere = cursor ? KeysetProcessor.buildAfter(orderByEntries, CursorCodec.decode(cursor)) : undefined;
    const where = and(eq(supplierItems.inventoryItemId, inventoryItemId), cursorWhere);

    const { rows, hasMore } = await this.repository.findSuppliersFeedKeyset(siteId, { where, orderBy, limit });
    const edges = rows.map((row) => ({
      cursor: CursorCodec.encode(orderByEntries.map((e) => (row as Record<string, unknown>)[e.key])),
      node: InventoryItemSupplierDto.from(row, row.supplierName, row.supplierCode, row.uomSymbol),
    }));
    return {
      edges,
      pageInfo: { hasNextPage: hasMore, endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null },
    };
  }

  // Returns the inventory_item_id that owns a given supplier_items row, or null if not found.
  async findInventoryItemIdFor(supplierItemId: string): Promise<string | null> {
    const row = await this.repository.findSupplierItemById(supplierItemId);
    return row?.inventoryItemId ?? null;
  }

  // Returns a supplier item with display joins and supplier code
  async findItemDetail(supplierItemId: string): Promise<SupplierItemDetailDto> {
    const row = await this.repository.findItemDetailById(supplierItemId);
    if (!row) throw new NotFoundException('Supplier item not found.');
    return SupplierItemDetailDto.fromDetail(row, row.inventoryItemName, row.uomSymbol);
  }

  // Returns a supplier item carried by a site with that site's terms and price in force
  async findSiteItemDetail(supplierItemId: string, siteId: string): Promise<SupplierSiteItemDetailDto> {
    const row = await this.repository.findSiteItemDetailById(supplierItemId, siteId);
    if (!row) throw new NotFoundException('Supplier item not found.');
    return SupplierSiteItemDetailDto.fromSiteDetail(row, row.inventoryItemName, row.uomSymbol);
  }

  // Links an item to a supplier and sets it up at the given enrolled sites
  async addItem(
    supplierId: string,
    data: Omit<AddSupplierItemDto, 'supplierId'>,
    inventoryItemName: string,
  ): Promise<CreateResponseDto<SupplierItemDto>> {
    const supplier = await this.requireSupplier(supplierId);

    const existing = await this.repository.findItemBySupplierInventoryItemAndUom(
      supplierId,
      data.inventoryItemId,
      data.uomId,
    );
    if (existing) {
      throw new BadRequestException({
        label: 'Duplicate Item',
        detail: 'This item with the selected UOM is already linked to this supplier.',
      });
    }
    const siteIds = [...new Set(data.siteIds)];
    await this.assertEnrolled(supplierId, siteIds);
    await this.repository.assertMinOrderFitsUnit(data.uomId, data.minOrderQuantity);

    const uomSymbol = await this.repository.findUomSymbol(data.uomId);
    const created = await this.database.runInTransaction(async () => {
      const item = await this.repository.createSupplierItem({
        supplierId,
        inventoryItemId: data.inventoryItemId,
        supplierItemCode: data.supplierItemCode ?? null,
        minOrderQuantity: data.minOrderQuantity ?? null,
        defaultLeadTimeDays: data.defaultLeadTimeDays,
        uomId: data.uomId,
      });
      await this.repository.insertSiteItems(
        siteIds.map((siteId) => ({
          legalEntityId: supplier.legalEntityId,
          siteId,
          supplierItemId: item.id,
          inventoryItemId: item.inventoryItemId,
          leadTimeDays: item.defaultLeadTimeDays,
        })),
      );
      return item;
    });

    return {
      success: true,
      message: `"${inventoryItemName}" (${uomSymbol}) added to supplier for ${pluralize('site', siteIds.length, true)}.`,
      data: SupplierItemDto.from({ ...created, siteCount: siteIds.length }, inventoryItemName, uomSymbol),
    };
  }

  async updateItem(
    supplierId: string,
    supplierItemId: string,
    data: Omit<UpdateSupplierItemDto, 'supplierId' | 'supplierItemId'>,
  ): Promise<SuccessResponseDto> {
    await this.requireSupplier(supplierId);
    const existing = await this.repository.findSupplierItemById(supplierItemId);
    if (!existing || existing.supplierId !== supplierId) {
      throw new NotFoundException('Supplier item not found.');
    }

    const update: Partial<NewSupplierItem> = {};
    if (data.supplierItemCode !== undefined) update.supplierItemCode = data.supplierItemCode ?? null;
    if (data.uomId !== undefined && data.uomId !== existing.uomId) {
      // Its prices are per this unit, so the unit is fixed once the item is priced
      if ((await this.repository.countPrices([supplierItemId])).prices > 0) {
        throw new BadRequestException({
          label: 'Item Is Priced',
          detail: `"${existing.inventoryItemName}" has prices per ${existing.uomSymbol}, so its unit cannot change. Add the item again in the other unit instead.`,
          errors: [{ field: 'uomId', message: `Priced per ${existing.uomSymbol}` }],
        });
      }
      update.uomId = data.uomId;
    }
    if (data.minOrderQuantity !== undefined) update.minOrderQuantity = data.minOrderQuantity;
    if (data.defaultLeadTimeDays !== undefined) update.defaultLeadTimeDays = data.defaultLeadTimeDays;
    if (update.uomId !== undefined || update.minOrderQuantity !== undefined) {
      await this.repository.assertMinOrderFitsUnit(
        update.uomId ?? existing.uomId,
        update.minOrderQuantity !== undefined ? update.minOrderQuantity : existing.minOrderQuantity,
      );
    }

    if (Object.keys(update).length === 0) {
      return { success: true, message: 'No changes to apply.' };
    }

    // A new default lead time reaches every site still following the item; sites with their own keep it
    const defaultLeadTimeDays = update.defaultLeadTimeDays;
    const defaultLeadTimeChanged =
      defaultLeadTimeDays !== undefined && defaultLeadTimeDays !== existing.defaultLeadTimeDays;
    const cascaded = await this.database.runInTransaction(async () => {
      await this.repository.updateSupplierItem(supplierItemId, update);
      return defaultLeadTimeChanged
        ? this.repository.applyDefaultLeadTimeToSiteItems([supplierItemId], defaultLeadTimeDays)
        : 0;
    });
    const name = `"${existing.inventoryItemName}" (${existing.uomSymbol})`;
    if (!defaultLeadTimeChanged) return { success: true, message: `${name} updated successfully.` };
    const kept = (await this.repository.findSiteIdsOfItem(supplierItemId)).length - cascaded;
    return {
      success: true,
      message: `${name} updated; lead time applied to ${pluralize('site', cascaded, true)}${
        kept > 0 ? `, ${pluralize('site', kept, true)} kept their own` : ''
      }.`,
    };
  }

  async unlinkItem(supplierId: string, supplierItemId: string): Promise<SuccessResponseDto> {
    await this.requireSupplier(supplierId);
    const existing = await this.repository.findSupplierItemById(supplierItemId);
    if (!existing || existing.supplierId !== supplierId) {
      throw new NotFoundException('Supplier item not found.');
    }

    await this.assertUnpriced([supplierItemId]);
    await this.repository.deleteSupplierItem(supplierItemId);
    return {
      success: true,
      message: `"${existing.inventoryItemName}" (${existing.uomSymbol}) deleted from the supplier.`,
    };
  }

  // Marks the selected supplier items preferred (or not) at the selected sites; items not set up at a site are skipped
  async bulkSetSiteItemsPreferred(dto: BulkSetSupplierSiteItemPreferredDto): Promise<SuccessResponseDto> {
    await this.requireSupplier(dto.supplierId);
    const siteItems = await this.repository.findSiteItemsFor(dto.supplierItemIds, [...new Set(dto.siteIds)]);
    await this.database.runInTransaction(async () => {
      for (const supplierSiteItem of siteItems) {
        await this.applySiteItemSettings(supplierSiteItem, { isPreferred: dto.isPreferred });
      }
    });
    return {
      success: true,
      message: `${pluralize('site item', siteItems.length, true)} marked ${dto.isPreferred ? 'preferred' : 'not preferred'}.`,
    };
  }

  // Sets the minimum order of the selected supplier items
  async bulkSetMinOrder(dto: BulkSetSupplierItemMinOrderDto): Promise<SuccessResponseDto> {
    await this.requireSupplier(dto.supplierId);
    await this.repository.assertMinOrderFitsUnits(dto.supplierItemIds, dto.minOrderQuantity);
    const updated = await this.repository.bulkUpdateSupplierItems(dto.supplierId, dto.supplierItemIds, {
      minOrderQuantity: dto.minOrderQuantity ?? null,
    });
    return {
      success: true,
      message: `Minimum order ${dto.minOrderQuantity == null ? 'cleared' : 'set'} on ${pluralize('item', updated.length, true)}.`,
    };
  }

  // Sets the default lead time of the selected supplier items and applies it to their sites that do not set their own
  async bulkSetDefaultLeadTime(dto: BulkSetSupplierItemDefaultLeadTimeDto): Promise<SuccessResponseDto> {
    await this.requireSupplier(dto.supplierId);
    const { updated, cascaded } = await this.database.runInTransaction(async () => {
      const updated = await this.repository.bulkUpdateSupplierItems(dto.supplierId, dto.supplierItemIds, {
        defaultLeadTimeDays: dto.defaultLeadTimeDays,
      });
      const cascaded = await this.repository.applyDefaultLeadTimeToSiteItems(updated, dto.defaultLeadTimeDays);
      return { updated, cascaded };
    });
    return {
      success: true,
      message: `Default lead time set to ${pluralize('day', dto.defaultLeadTimeDays, true)} on ${pluralize('item', updated.length, true)} and applied to ${pluralize('site', cascaded, true)}.`,
    };
  }

  // Returns the paginated site items of a supplier item
  async findSiteItemsForTable(
    supplierItemId: string,
    state: TableState,
  ): Promise<{ result: SupplierSiteItemDto[]; count: number }> {
    const item = await this.repository.findById(supplierItemId);
    if (!item) throw new NotFoundException('Supplier item not found.');
    const { result, count } = await this.repository.findSiteItemsForTable(
      supplierItemId,
      SupplierItemsDomainService.tableOptions(state, SupplierItemsDomainService.SITE_ITEMS_OF_ITEM_FIELD_MAP),
    );
    return { result: result.map(SupplierSiteItemDto.from), count };
  }

  // Sets a supplier item up at an enrolled site
  async createSiteItem(dto: AddSupplierSiteItemDto): Promise<CreateResponseDto<SupplierSiteItemDto>> {
    const item = await this.repository.findById(dto.supplierItemId);
    if (!item) throw new NotFoundException('Supplier item not found.');
    const supplier = await this.requireSupplier(item.supplierId);
    await this.assertEnrolled(item.supplierId, [dto.siteId]);
    if (await this.repository.findSiteItem(dto.supplierItemId, dto.siteId)) {
      throw new BadRequestException({
        label: 'Already At Site',
        detail: 'This item is already set up at the selected site.',
        errors: [{ field: 'siteId', message: 'Already set up at this site' }],
      });
    }

    const supplierSiteItem = await this.database.runInTransaction(async () => {
      const [created] = await this.repository.insertSiteItems([
        {
          legalEntityId: supplier.legalEntityId,
          siteId: dto.siteId,
          supplierItemId: dto.supplierItemId,
          inventoryItemId: item.inventoryItemId,
          // A lead time given here is the site's own; otherwise the site follows the item's default
          leadTimeDays: dto.leadTimeDays ?? item.defaultLeadTimeDays,
          isLeadTimeOverridden: dto.leadTimeDays !== undefined,
        },
      ]);
      return dto.isPreferred ? this.applySiteItemSettings(created, { isPreferred: true }) : created;
    });
    return {
      success: true,
      message: 'Item set up at site successfully.',
      data: SupplierSiteItemDto.from(supplierSiteItem),
    };
  }

  // Updates a supplier item's settings at one site; an omitted field is left as it is
  async updateSiteItem(dto: UpdateSupplierSiteItemDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findSiteItemById(dto.id);
    if (!existing) throw new NotFoundException('Site item not found.');
    const item = dto.followDefaultLeadTime ? await this.repository.findById(existing.supplierItemId) : undefined;
    if (dto.followDefaultLeadTime && !item) throw new NotFoundException('Supplier item not found.');
    // Following the default takes the item's default lead time back; setting one pins it to this site
    const leadTime = item
      ? { leadTimeDays: item.defaultLeadTimeDays, isLeadTimeOverridden: false }
      : dto.leadTimeDays !== undefined
        ? { leadTimeDays: dto.leadTimeDays, isLeadTimeOverridden: true }
        : {};
    await this.database.runInTransaction(() =>
      this.applySiteItemSettings(existing, {
        isPreferred: dto.isPreferred,
        ...leadTime,
      }),
    );
    return { success: true, message: 'Site item updated successfully.' };
  }

  // Removes a supplier item from a site; its price history at the site is kept
  async deleteSiteItem(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findSiteItemById(id);
    if (!existing) throw new NotFoundException('Site item not found.');
    await this.repository.deleteSiteItem(id);
    return { success: true, message: 'Item removed from site successfully.' };
  }

  // Finds the supplier's item for a quoted item and unit — creating it when the supplier does not have it yet — and sets
  // it up at the site when the site does not carry it (with no site, for the whole legal entity, it sets up nowhere);
  // returns the supplier item's id
  async findOrCreateItemAtSite(line: QuotedItem, siteId: string | null): Promise<string> {
    let item = await this.repository.findItemBySupplierInventoryItemAndUom(
      line.supplierId,
      line.inventoryItemId,
      line.uomId,
    );
    const supplier = await this.requireSupplier(line.supplierId);
    if (!item) {
      item = await this.repository.createSupplierItem({
        supplierId: line.supplierId,
        inventoryItemId: line.inventoryItemId,
        supplierItemCode: line.supplierItemCode,
        uomId: line.uomId,
      });
    }
    if (siteId && !(await this.repository.findSiteItem(item.id, siteId))) {
      await this.repository.insertSiteItems([
        {
          legalEntityId: supplier.legalEntityId,
          siteId,
          supplierItemId: item.id,
          inventoryItemId: item.inventoryItemId,
          leadTimeDays: item.defaultLeadTimeDays,
        },
      ]);
    }
    return item.id;
  }

  // Writes site item settings; marking preferred first clears the flag from the item's other suppliers at that site
  private async applySiteItemSettings(
    supplierSiteItem: SupplierSiteItem,
    data: Partial<Pick<NewSupplierSiteItem, 'isPreferred' | 'leadTimeDays' | 'isLeadTimeOverridden'>>,
  ): Promise<SupplierSiteItem> {
    const update = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    ) as Partial<NewSupplierSiteItem>;
    if (Object.keys(update).length === 0) return supplierSiteItem;
    if (update.isPreferred) {
      await this.repository.clearPreferredAtSite(
        supplierSiteItem.inventoryItemId,
        supplierSiteItem.siteId,
        supplierSiteItem.id,
      );
    }
    await this.repository.updateSiteItem(supplierSiteItem.id, update);
    return { ...supplierSiteItem, ...update } as SupplierSiteItem;
  }

  // A supplier item with any price history cannot be deleted — the history is kept, so only an unpriced item goes
  private async assertUnpriced(supplierItemIds: string[]): Promise<void> {
    const { prices, sites } = await this.repository.countPrices(supplierItemIds);
    if (prices === 0) return;
    throw new ConflictException({
      label: 'Item Has Prices',
      detail: `${supplierItemIds.length === 1 ? 'This item has' : 'These items have'} ${pluralize('price', prices, true)} across ${pluralize('site', sites, true)}. Price history is kept, so only an item that was never priced can be deleted.`,
    });
  }

  private async requireSupplier(supplierId: string): Promise<Supplier> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    return supplier;
  }

  private async assertEnrolled(supplierId: string, siteIds: string[]): Promise<void> {
    const enrolled = new Set(await this.repository.findEnrolledSiteIds(supplierId));
    if (siteIds.some((siteId) => !enrolled.has(siteId))) {
      throw new BadRequestException({
        label: 'Supplier Not Enrolled',
        detail: 'The supplier must be enrolled at a site before its items can be set up there.',
        errors: [{ field: 'siteIds', message: 'Supplier is not enrolled at every selected site' }],
      });
    }
  }

  private static tableOptions(state: TableState, fieldMap: FieldMap) {
    const { limit = 20, offset = 0 } = state.pagination;
    return {
      where: and(
        FilterProcessor.buildWhere(state.filters, fieldMap),
        FilterProcessor.buildSearch(state.search, fieldMap),
      ),
      orderBy: FilterProcessor.buildOrderBy(state.sort, fieldMap),
      limit,
      offset,
    };
  }
}
