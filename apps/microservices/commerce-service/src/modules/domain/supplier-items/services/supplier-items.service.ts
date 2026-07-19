import {
  InventoryItemSupplierDto,
  SupplierItemDetailDto,
  SupplierItemDto,
} from '@domain/suppliers/dto/entity/supplier.dto';
import { Injectable } from '@nestjs/common';
import {
  type CreateResponseDto,
  CursorCodec,
  type FieldMap,
  FilterProcessor,
  type KeysetOrderBy,
  KeysetProcessor,
  PrimaryDatabaseService,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, asc, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, NotFoundException, ValidationException } from '@vritti/api-sdk/exceptions';
import { CurrencyAmountDto, type CurrencyCode, majorToMinor } from '@vritti/api-sdk/money';
import {
  inventoryItems,
  type NewSupplierItemPrice,
  parties,
  type SupplierItemPrice,
  type SupplierPriceSource,
  supplierItemPrices,
  supplierItemSites,
  supplierItems,
  suppliers,
  uom,
} from '@/db/schema';
import { SupplierItemPriceDto } from '../dto/entity/supplier-item-price.dto';
import { SupplierItemSiteDto } from '../dto/entity/supplier-item-site.dto';
import type { AddSupplierItemDto } from '../dto/request/add-supplier-item.dto';
import type { AddSupplierItemPriceDto } from '../dto/request/add-supplier-item-price.dto';
import type { AddSupplierItemSiteDto } from '../dto/request/add-supplier-item-site.dto';
import type { BulkSetSupplierItemPreferredDto } from '../dto/request/bulk-set-supplier-item-preferred.dto';
import type { BulkSetSupplierItemSchemeDto } from '../dto/request/bulk-set-supplier-item-scheme.dto';
import type { BulkUnlinkSupplierItemsDto } from '../dto/request/bulk-unlink-supplier-items.dto';
import type { UpdateSupplierItemDto } from '../dto/request/update-supplier-item.dto';
import type { UpdateSupplierItemPriceDto } from '../dto/request/update-supplier-item-price.dto';
import type { UpdateSupplierItemSiteDto } from '../dto/request/update-supplier-item-site.dto';
import { SupplierItemsDomainRepository } from '../repositories/supplier-items.repository';

export interface AddSupplierItemPriceInput {
  unitPrice: bigint;
  schemeBuyQty?: number | null;
  schemeFreeQty?: number | null;
  validFrom: string;
  validTo?: string | null;
  source?: SupplierPriceSource;
}

@Injectable()
export class SupplierItemsDomainService {
  // Field map for the supplier-rooted "items linked to this supplier" view (joins inventory_items + uom)
  private static readonly FIELD_MAP: FieldMap = {
    inventoryItemName: { column: inventoryItems.name, type: 'string' },
    supplierItemCode: { column: supplierItems.supplierItemCode, type: 'string' },
    uomSymbol: { column: uom.symbol, type: 'string' },
    minOrderQuantity: { column: supplierItems.minOrderQuantity, type: 'number' },
    leadTimeDays: { column: supplierItems.leadTimeDays, type: 'number' },
    isPreferred: { column: supplierItems.isPreferred, type: 'boolean' },
    isActive: { column: supplierItems.isActive, type: 'boolean' },
  };

  // Field map for the inventory-item-rooted "suppliers carrying this item" view (joins suppliers + uom)
  private static readonly SUPPLIERS_FOR_ITEM_FIELD_MAP: FieldMap = {
    supplierName: { column: parties.displayName, type: 'string' },
    supplierCode: { column: suppliers.code, type: 'string' },
    supplierItemCode: { column: supplierItems.supplierItemCode, type: 'string' },
    uomSymbol: { column: uom.symbol, type: 'string' },
    minOrderQuantity: { column: supplierItems.minOrderQuantity, type: 'number' },
    leadTimeDays: { column: supplierItems.leadTimeDays, type: 'number' },
    isPreferred: { column: supplierItems.isPreferred, type: 'boolean' },
    isActive: { column: supplierItems.isActive, type: 'boolean' },
  };

  // Field map for the supplier item price timeline table
  private static readonly PRICE_FIELD_MAP: FieldMap = {
    unitPrice: { column: supplierItemPrices.unitPrice, type: 'number' },
    validFrom: { column: supplierItemPrices.validFrom, type: 'string' },
    validTo: { column: supplierItemPrices.validTo, type: 'string' },
    source: { column: supplierItemPrices.source, type: 'string' },
  };

  // Field map for the supplier item per-site override table
  private static readonly ITEM_SITE_FIELD_MAP: FieldMap = {
    leadTimeDays: { column: supplierItemSites.leadTimeDays, type: 'number' },
    minOrderQuantity: { column: supplierItemSites.minOrderQuantity, type: 'number' },
  };

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly repository: SupplierItemsDomainRepository,
  ) {}

  // Returns paginated supplier item options for select dropdowns and filters.
  // When supplierId is absent, returns all active supplier items across all suppliers (supplier name on description).
  // When excludeOnPurchaseOrderId / excludeOnGoodsReceiptId is supplied, hides items already on that PO / GR.
  findForSelect(
    query: SelectOptionsQueryDto,
    options?: {
      supplierId?: string;
      excludeOnPurchaseOrderId?: string;
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

  // Returns paginated supplier items for a supplier with the resolved current price
  async findForTable(supplierId: string, state: TableViewState): Promise<{ result: SupplierItemDto[]; count: number }> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    const filterWhere = FilterProcessor.buildWhere(state.filters, SupplierItemsDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, SupplierItemsDomainService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, SupplierItemsDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findItemsForTable(supplierId, {
      where,
      orderBy,
      limit,
      offset,
    });

    return {
      result: result.map((row) =>
        SupplierItemDto.from(row, row.inventoryItemName, row.uomSymbol, row.currentUnitPrice),
      ),
      count,
    };
  }

  // Returns paginated suppliers carrying an inventory item with the resolved current price
  async findSuppliersForItem(
    inventoryItemId: string,
    state: TableViewState,
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

    const { result, count } = await this.repository.findSuppliersForItem(inventoryItemId, {
      where: where || undefined,
      orderBy,
      limit,
      offset,
    });

    return {
      result: result.map((row) =>
        InventoryItemSupplierDto.from(row, row.supplierName, row.supplierCode, row.uomSymbol, row.currentUnitPrice),
      ),
      count,
    };
  }

  // Keyset feed of an item's supplier links. Ordered by (isPreferred desc, createdAt desc, id asc); the
  // cursor encodes those boundary values (via CursorCodec) so pages don't skip/duplicate.
  async findSuppliersFeed(
    inventoryItemId: string,
    limit: number,
    cursor?: string,
  ): Promise<{
    edges: { cursor: string; node: InventoryItemSupplierDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    const orderByEntries: (KeysetOrderBy & { key: string })[] = [
      { column: supplierItems.isPreferred, direction: 'desc', key: 'isPreferred' },
      { column: supplierItems.createdAt, direction: 'desc', key: 'createdAt' },
      { column: supplierItems.id, direction: 'asc', key: 'id' },
    ];
    const orderBy = orderByEntries.map((e) => (e.direction === 'asc' ? asc(e.column) : desc(e.column)));
    const cursorWhere = cursor ? KeysetProcessor.buildAfter(orderByEntries, CursorCodec.decode(cursor)) : undefined;
    const where = and(eq(supplierItems.inventoryItemId, inventoryItemId), cursorWhere);

    const { rows, hasMore } = await this.repository.findSuppliersFeedKeyset({ where, orderBy, limit });
    const edges = rows.map((row) => ({
      cursor: CursorCodec.encode(orderByEntries.map((e) => (row as Record<string, unknown>)[e.key])),
      node: InventoryItemSupplierDto.from(row, row.supplierName, row.supplierCode, row.uomSymbol, row.currentUnitPrice),
    }));
    return {
      edges,
      pageInfo: { hasNextPage: hasMore, endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null },
    };
  }

  async findItemIds(supplierId: string): Promise<string[]> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    return this.repository.findItemIdsBySupplierId(supplierId);
  }

  // Returns the inventory_item_id that owns a given supplier_items row, or null if not found.
  // Used by top-level cross-domain validation (no inventory-items dependency in this domain).
  async findInventoryItemIdFor(supplierItemId: string): Promise<string | null> {
    const row = await this.repository.findSupplierItemById(supplierItemId);
    return row?.inventoryItemId ?? null;
  }

  // Returns a supplier item with display joins, supplier code, and the resolved current price
  async findItemDetail(supplierItemId: string): Promise<SupplierItemDetailDto> {
    const row = await this.repository.findItemDetailById(supplierItemId);
    if (!row) throw new NotFoundException('Supplier item not found.');
    return SupplierItemDetailDto.fromDetail(row, row.inventoryItemName, row.uomSymbol, row.currentUnitPrice);
  }

  // Links an item to a supplier and, when an initial price is supplied, opens its price timeline
  async addItem(
    supplierId: string,
    data: Omit<AddSupplierItemDto, 'supplierId'>,
    inventoryItemName: string,
  ): Promise<CreateResponseDto<SupplierItemDto>> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

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

    // Per-row currency must match the supplier's (composite FK). Reject early with a field-scoped error.
    if (data.unitPrice && data.unitPrice.currency !== supplier.currencyCode) {
      throw new ValidationException({
        detail: `Unit price currency must match the supplier currency (${supplier.currencyCode}).`,
        errors: [{ field: 'unitPrice', message: `Must be in ${supplier.currencyCode}.` }],
      });
    }

    const initialPriceMinor = data.unitPrice
      ? majorToMinor(data.unitPrice.value, supplier.currencyCode as CurrencyCode, 'unitPrice')
      : null;
    const uomSymbol = await this.repository.findUomSymbol(data.uomId);

    const created = await this.database.runInTransaction(async () => {
      if (data.isPreferred === true) {
        await this.repository.clearPreferredForOtherSuppliers(data.inventoryItemId);
      }

      const item = await this.repository.createSupplierItem({
        supplierId,
        inventoryItemId: data.inventoryItemId,
        supplierItemCode: data.supplierItemCode ?? null,
        currencyCode: supplier.currencyCode,
        uomId: data.uomId,
        minOrderQuantity: data.minOrderQuantity ?? null,
        leadTimeDays: data.leadTimeDays ?? null,
        isPreferred: data.isPreferred ?? false,
        schemeBuyQty: data.schemeBuyQty ?? null,
        schemeFreeQty: data.schemeFreeQty ?? null,
        hasScheme: data.hasScheme ?? false,
        taxInclusive: data.taxInclusive ?? false,
      });

      if (initialPriceMinor !== null) {
        await this.applyPriceInsert(item.id, {
          unitPrice: initialPriceMinor,
          schemeBuyQty: data.schemeBuyQty ?? null,
          schemeFreeQty: data.schemeFreeQty ?? null,
          validFrom: SupplierItemsDomainService.today(),
          source: 'MANUAL',
        });
      }

      return item;
    });

    return {
      success: true,
      message: `"${inventoryItemName}" (${uomSymbol}) added to supplier successfully.`,
      data: SupplierItemDto.from(created, inventoryItemName, uomSymbol, initialPriceMinor),
    };
  }

  async updateItem(
    supplierId: string,
    supplierItemId: string,
    data: Omit<UpdateSupplierItemDto, 'supplierId' | 'supplierItemId'>,
  ): Promise<SuccessResponseDto> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    const existing = await this.repository.findSupplierItemById(supplierItemId);
    if (!existing || existing.supplierId !== supplierId) {
      throw new NotFoundException('Supplier item not found.');
    }

    const update: Record<string, unknown> = {};

    if (data.supplierItemCode !== undefined) update.supplierItemCode = data.supplierItemCode ?? null;
    if (data.uomId !== undefined) update.uomId = data.uomId;
    if (data.minOrderQuantity !== undefined) update.minOrderQuantity = data.minOrderQuantity ?? null;
    if (data.leadTimeDays !== undefined) update.leadTimeDays = data.leadTimeDays;
    if (data.isPreferred !== undefined) update.isPreferred = data.isPreferred;
    if (data.isActive !== undefined) update.isActive = data.isActive;
    if (data.schemeBuyQty !== undefined) update.schemeBuyQty = data.schemeBuyQty;
    if (data.schemeFreeQty !== undefined) update.schemeFreeQty = data.schemeFreeQty;
    if (data.hasScheme !== undefined) update.hasScheme = data.hasScheme;
    if (data.taxInclusive !== undefined) update.taxInclusive = data.taxInclusive;

    if (Object.keys(update).length === 0) {
      return { success: true, message: 'No changes to apply.' };
    }

    // If marking as preferred, clear preferred on any other supplier_item for this inventory item first
    if (data.isPreferred === true) {
      await this.repository.clearPreferredForOtherSuppliers(existing.inventoryItemId, supplierItemId);
    }

    await this.repository.updateSupplierItem(supplierItemId, update);
    return { success: true, message: `"${existing.inventoryItemName}" (${existing.uomSymbol}) updated successfully.` };
  }

  async unlinkItem(supplierId: string, supplierItemId: string): Promise<SuccessResponseDto> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    const existing = await this.repository.findSupplierItemById(supplierItemId);
    if (!existing || existing.supplierId !== supplierId) {
      throw new NotFoundException('Supplier item not found.');
    }

    await this.repository.deleteSupplierItem(supplierItemId);
    return {
      success: true,
      message: `"${existing.inventoryItemName}" (${existing.uomSymbol}) removed from supplier successfully.`,
    };
  }

  // Bulk-removes multiple supplier items for a supplier
  async bulkUnlinkItems(dto: BulkUnlinkSupplierItemsDto): Promise<SuccessResponseDto> {
    const supplier = await this.repository.findSupplierById(dto.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    await this.repository.bulkDeleteSupplierItems(dto.supplierItemIds);
    return {
      success: true,
      message: `${dto.supplierItemIds.length} item${dto.supplierItemIds.length === 1 ? '' : 's'} removed from supplier.`,
    };
  }

  // Bulk-sets the free-goods scheme on multiple supplier items at once
  async bulkSetScheme(dto: BulkSetSupplierItemSchemeDto): Promise<SuccessResponseDto> {
    const supplier = await this.repository.findSupplierById(dto.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    await this.repository.bulkSetScheme(dto.supplierItemIds, {
      buyQty: dto.schemeBuyQty ?? null,
      freeQty: dto.schemeFreeQty ?? null,
      hasScheme: dto.hasScheme ?? false,
    });
    return {
      success: true,
      message: `Scheme updated for ${dto.supplierItemIds.length} item${dto.supplierItemIds.length === 1 ? '' : 's'}.`,
    };
  }

  // Bulk-marks multiple supplier items as preferred (or clears it) in a single request
  async bulkSetPreferred(dto: BulkSetSupplierItemPreferredDto): Promise<SuccessResponseDto> {
    const supplier = await this.repository.findSupplierById(dto.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    await this.repository.bulkSetPreferred(dto.supplierItemIds, dto.isPreferred);
    return {
      success: true,
      message: `${dto.supplierItemIds.length} item${dto.supplierItemIds.length === 1 ? '' : 's'} marked ${dto.isPreferred ? 'preferred' : 'not preferred'}.`,
    };
  }

  // Returns the price prefill for a (supplier, item, uom) — resolved for the session context (site row wins)
  async findItemPrice(
    supplierId: string,
    inventoryItemId: string,
    uomId: string,
  ): Promise<{ unitPrice: CurrencyAmountDto | null; schemeBuyQty: number | null; schemeFreeQty: number | null }> {
    const item = await this.repository.findItemBySupplierInventoryItemAndUom(supplierId, inventoryItemId, uomId);
    if (!item) return { unitPrice: null, schemeBuyQty: null, schemeFreeQty: null };
    const resolved = await this.repository.resolvePrice(item.id);
    return {
      unitPrice: CurrencyAmountDto.from(resolved?.unitPrice ?? null, item.currencyCode),
      schemeBuyQty: resolved?.schemeBuyQty ?? item.schemeBuyQty ?? null,
      schemeFreeQty: resolved?.schemeFreeQty ?? item.schemeFreeQty ?? null,
    };
  }

  // Returns the price row effective on a date for the session context, or null when unpriced
  async resolvePrice(supplierItemId: string, onDate?: string): Promise<SupplierItemPriceDto | null> {
    const item = await this.repository.findById(supplierItemId);
    if (!item) throw new NotFoundException('Supplier item not found.');
    const row = await this.repository.resolvePrice(supplierItemId, onDate);
    return row ? SupplierItemPriceDto.from(row, item.currencyCode) : null;
  }

  // Returns a single price row as a DTO, or null when it does not exist
  async findPriceById(id: string): Promise<SupplierItemPriceDto | null> {
    const row = await this.repository.findPriceById(id);
    if (!row) return null;
    const item = await this.repository.findById(row.supplierItemId);
    return SupplierItemPriceDto.from(row, item?.currencyCode ?? '');
  }

  // Returns the paginated price timeline of a supplier item — site rows scoped by the session site GUC
  async findPricesForTable(
    supplierItemId: string,
    state: TableViewState,
  ): Promise<{ result: SupplierItemPriceDto[]; count: number }> {
    const item = await this.repository.findById(supplierItemId);
    if (!item) throw new NotFoundException('Supplier item not found.');

    const filterWhere = FilterProcessor.buildWhere(state.filters, SupplierItemsDomainService.PRICE_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, SupplierItemsDomainService.PRICE_FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, SupplierItemsDomainService.PRICE_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findPricesForTable(supplierItemId, {
      where,
      orderBy,
      limit,
      offset,
    });
    return { result: result.map((row) => SupplierItemPriceDto.from(row, item.currencyCode)), count };
  }

  // Adds a validity-dated price, delimiting the currently-open row (SAP ME11)
  async addPrice(dto: AddSupplierItemPriceDto): Promise<CreateResponseDto<SupplierItemPriceDto>> {
    const item = await this.repository.findById(dto.supplierItemId);
    if (!item) throw new NotFoundException('Supplier item not found.');

    const data: AddSupplierItemPriceInput = {
      unitPrice: majorToMinor(dto.unitPrice.value, dto.unitPrice.currency, 'unitPrice'),
      schemeBuyQty: dto.schemeBuyQty ?? null,
      schemeFreeQty: dto.schemeFreeQty ?? null,
      validFrom: dto.validFrom,
      validTo: dto.validTo ?? null,
    };
    const row = await this.database.runInTransaction(() => this.applyPriceInsert(dto.supplierItemId, data));
    return {
      success: true,
      message: 'Price added successfully.',
      data: SupplierItemPriceDto.from(row, item.currencyCode),
    };
  }

  // Updates a price row's amount, scheme, or end date (valid_from is immutable)
  async updatePrice(dto: UpdateSupplierItemPriceDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findPriceById(dto.id);
    if (!existing) throw new NotFoundException('Price not found.');

    const update: Partial<NewSupplierItemPrice> = {};
    if (dto.unitPrice !== undefined) {
      update.unitPrice = majorToMinor(dto.unitPrice.value, dto.unitPrice.currency, 'unitPrice');
    }
    if (dto.schemeBuyQty !== undefined) update.schemeBuyQty = dto.schemeBuyQty;
    if (dto.schemeFreeQty !== undefined) update.schemeFreeQty = dto.schemeFreeQty;
    if (dto.validTo !== undefined) update.validTo = dto.validTo;

    if (Object.keys(update).length === 0) {
      return { success: true, message: 'No changes to apply.' };
    }

    await this.repository.updatePriceRow(dto.id, update);
    return { success: true, message: 'Price updated successfully.' };
  }

  // Deletes a price row; re-opens the contiguous prior row when the newest row is removed
  async deletePrice(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findPriceById(id);
    if (!existing) throw new NotFoundException('Price not found.');

    await this.database.runInTransaction(async () => {
      const hasLater = await this.repository.hasLaterPrice(
        existing.supplierItemId,
        existing.siteId,
        existing.validFrom,
      );
      const prior = hasLater
        ? undefined
        : await this.repository.findContiguousPreviousPrice(
            existing.supplierItemId,
            existing.siteId,
            existing.validFrom,
          );
      await this.repository.deletePriceRow(id);
      if (prior) await this.repository.updatePriceRow(prior.id, { validTo: null });
    });

    return { success: true, message: 'Price removed successfully.' };
  }

  // Returns the paginated per-site operational overrides of a supplier item
  async findItemSitesForTable(
    supplierItemId: string,
    state: TableViewState,
  ): Promise<{ result: SupplierItemSiteDto[]; count: number }> {
    const item = await this.repository.findById(supplierItemId);
    if (!item) throw new NotFoundException('Supplier item not found.');

    const filterWhere = FilterProcessor.buildWhere(state.filters, SupplierItemsDomainService.ITEM_SITE_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, SupplierItemsDomainService.ITEM_SITE_FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, SupplierItemsDomainService.ITEM_SITE_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findItemSitesForTable(supplierItemId, {
      where,
      orderBy,
      limit,
      offset,
    });
    return { result: result.map(SupplierItemSiteDto.from), count };
  }

  // Creates or replaces the per-site override for a (supplier item, site) pair
  async upsertItemSite(
    supplierItemId: string,
    siteId: string,
    data: Omit<AddSupplierItemSiteDto, 'supplierItemId' | 'siteId'>,
  ): Promise<CreateResponseDto<SupplierItemSiteDto>> {
    const item = await this.repository.findById(supplierItemId);
    if (!item) throw new NotFoundException('Supplier item not found.');

    const row = await this.repository.upsertItemSite({
      supplierItemId,
      siteId,
      leadTimeDays: data.leadTimeDays ?? null,
      minOrderQuantity: data.minOrderQuantity ?? null,
    });
    return { success: true, message: 'Site override saved successfully.', data: SupplierItemSiteDto.from(row) };
  }

  // Updates a per-site override by ID (undefined skips, null clears)
  async updateItemSite(id: string, data: Omit<UpdateSupplierItemSiteDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.repository.findItemSiteById(id);
    if (!existing) throw new NotFoundException('Site override not found.');
    await this.repository.updateItemSite(id, data);
    return { success: true, message: 'Site override updated successfully.' };
  }

  // Deletes a per-site override by ID
  async deleteItemSite(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findItemSiteById(id);
    if (!existing) throw new NotFoundException('Site override not found.');
    await this.repository.deleteItemSite(id);
    return { success: true, message: 'Site override removed successfully.' };
  }

  // Delimit core (SAP ME11): rejects a later-or-equal row in the stratum, closes the open row, inserts.
  // Callers must run this inside a transaction; site_id is assigned by the DB GUC default on insert.
  private async applyPriceInsert(supplierItemId: string, data: AddSupplierItemPriceInput): Promise<SupplierItemPrice> {
    const conflict = await this.repository.hasPriceOnOrAfter(supplierItemId, data.validFrom);
    if (conflict) {
      throw new BadRequestException({
        label: 'Overlapping Price',
        detail: 'A price already exists on or after this start date. Remove or adjust it before adding a new one.',
        errors: [{ field: 'validFrom', message: 'A later price already exists' }],
      });
    }
    await this.repository.closeOpenPrice(supplierItemId, data.validFrom);
    return this.repository.insertPrice({
      supplierItemId,
      unitPrice: data.unitPrice,
      schemeBuyQty: data.schemeBuyQty ?? null,
      schemeFreeQty: data.schemeFreeQty ?? null,
      validFrom: data.validFrom,
      validTo: data.validTo ?? null,
      source: data.source ?? 'MANUAL',
    });
  }

  // Today's date as an ISO calendar day (YYYY-MM-DD) for a new price's start
  private static today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
