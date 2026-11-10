import { Injectable } from '@nestjs/common';
import {
  conditionValue,
  conditionValues,
  type FieldMap,
  type FilterCondition,
  FilterProcessor,
  type SortCondition,
} from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import Decimal from '@vritti/api-sdk/decimal';
import { and, gte, inArray, isNull, lte, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { majorToMinor } from '@vritti/api-sdk/money';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { isMatch } from 'date-fns';
import {
  type NewSupplierItemPrice,
  parties,
  type SupplierItemPrice,
  type SupplierPriceSource,
  SupplierPriceSourceValues,
  supplierItemPrices,
  suppliers,
  uom,
} from '@/db/schema';
import { ItemSupplierPriceComparisonDto } from '../dto/entity/item-supplier-price-comparison.dto';
import { ItemSupplierPriceDto, SupplierItemPriceDto } from '../dto/entity/supplier-item-price.dto';
import {
  type InventoryItemPriceHistoryDto,
  PriceHistoryLineDto,
  PriceWindowDto,
  SitePriceHistoryDto,
  type SupplierItemPriceHistoryDto,
} from '../dto/entity/supplier-item-price-history.dto';
import type { AddSupplierItemPriceDto } from '../dto/request/add-supplier-item-price.dto';
import type { UpdateSupplierItemPriceDto } from '../dto/request/update-supplier-item-price.dto';
import { ItemSupplierPriceComparisonsRepository } from '../repositories/item-supplier-price-comparisons.repository';
import {
  type ItemPriceAtSiteRow,
  SupplierItemPricesDomainRepository,
} from '../repositories/supplier-item-prices.repository';

// One quoted line as it lands at a site, already resolved to the supplier's item there
export interface QuotationPriceLine {
  supplierItemId: string;
  currencyCode: string;
  unitPrice: bigint;
  mrpId: string | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  taxInclusive: boolean;
}

export interface AddSupplierItemPriceInput {
  unitPrice: bigint;
  // One of the supplier's currencies
  currencyCode: string;
  mrpId?: string | null;
  schemeBuyQty?: number | null;
  schemeFreeQty?: number | null;
  taxInclusive?: boolean;
  validFrom: string;
  validTo?: string | null;
  source?: SupplierPriceSource;
  note?: string | null;
}

// A chart draws at most this many suppliers, one colour each from the categorical palette
export const MAX_CHARTED_SUPPLIERS = 8;

type PriceContext = NonNullable<Awaited<ReturnType<SupplierItemPricesDomainRepository['findPriceContext']>>>;

@Injectable()
export class SupplierItemPricesDomainService {
  // Field map for the supplier item price timeline table
  private static readonly PRICE_FIELD_MAP: FieldMap = {
    unitPrice: { column: supplierItemPrices.unitPrice, type: 'number' },
    validFrom: { column: supplierItemPrices.validFrom, type: 'string' },
    validTo: { column: supplierItemPrices.validTo, type: 'string' },
    source: { column: supplierItemPrices.source, type: 'string' },
    site: { column: supplierItemPrices.siteId, type: 'string' },
  };

  // Field map for an inventory item's prices from every supplier at a site
  private static readonly ITEM_PRICE_FIELD_MAP: FieldMap = {
    ...SupplierItemPricesDomainService.PRICE_FIELD_MAP,
    supplierName: { column: parties.displayName, type: 'string' },
    supplierCode: { column: suppliers.code, type: 'string' },
    uomSymbol: { column: uom.symbol, type: 'string' },
  };

  private static readonly PERIOD_FIELD: FieldMap = {
    currency: { column: supplierItemPrices.currencyCode, type: 'string' },
    period: {
      rangeExpression: (from, to) =>
        and(
          lte(supplierItemPrices.validFrom, to),
          or(isNull(supplierItemPrices.validTo), gte(supplierItemPrices.validTo, from)),
        ) as SQL,
      type: 'string',
    },
  };

  private static readonly ITEM_PRICE_HISTORY_FIELD_MAP: FieldMap = {
    ...SupplierItemPricesDomainService.PERIOD_FIELD,
    mrpIds: { column: supplierItemPrices.mrpId, type: 'string' },
  };

  private static readonly PRICE_HISTORY_FIELD_MAP: FieldMap = {
    ...SupplierItemPricesDomainService.PERIOD_FIELD,
    sites: {
      multiExpression: (siteIds, operator) =>
        operator === 'isAnyOf'
          ? (or(inArray(supplierItemPrices.siteId, siteIds), isNull(supplierItemPrices.siteId)) as SQL)
          : sql`true`,
      type: 'string',
    },
  };

  // Cheapest effective price per primary unit first, then by supplier
  private static readonly COMPARISON_DEFAULT_SORT: SortCondition[] = [
    { field: 'effectivePricePerPrimary', direction: 'asc' },
    { field: 'supplierName', direction: 'asc' },
  ];

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly repository: SupplierItemPricesDomainRepository,
    private readonly comparisonsRepository: ItemSupplierPriceComparisonsRepository,
  ) {}

  // Returns a site's price row effective on a date, or null when unpriced
  async resolvePrice(supplierItemId: string, siteId: string, onDate?: string): Promise<SupplierItemPriceDto | null> {
    await this.requirePriceContext(supplierItemId);
    const row = await this.repository.resolvePrice(supplierItemId, siteId, onDate);
    return row ? SupplierItemPriceDto.from(row) : null;
  }

  // Returns a single price row as a DTO, or null when it does not exist
  async findPriceById(id: string): Promise<SupplierItemPriceDto | null> {
    const row = await this.repository.findPriceById(id);
    return row ? SupplierItemPriceDto.from(row) : null;
  }

  // Returns the paginated price timeline of a supplier item as a site reads it — the workspace's own site, else the site
  // in the table's context: its own prices and the legal entity's it falls back to; with neither, every price
  async findPricesForTable(
    supplierItemId: string,
    state: TableState,
    workspaceSiteId?: string,
  ): Promise<{ result: SupplierItemPriceDto[]; count: number }> {
    await this.requirePriceContext(supplierItemId);

    // The context site is read as "what this site pays", not as an exact match that would hide the legal entity's prices
    const contextSite = state.filters.context.find((condition) => condition.field === 'site')?.value;
    const readingSiteId = workspaceSiteId ?? (typeof contextSite === 'string' ? contextSite : undefined);
    const filters = {
      ...state.filters,
      context: state.filters.context.filter((condition) => condition.field !== 'site'),
    };
    const filterWhere = FilterProcessor.buildWhere(filters, SupplierItemPricesDomainService.PRICE_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, SupplierItemPricesDomainService.PRICE_FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, SupplierItemPricesDomainService.PRICE_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findPricesForTable(supplierItemId, readingSiteId, {
      where,
      orderBy,
      limit,
      offset,
    });
    return { result: result.map((row) => SupplierItemPriceDto.from(row)), count };
  }

  // Returns the paginated prices of every supplier for an inventory item at one site
  async findItemPricesAtSiteForTable(
    inventoryItemId: string,
    siteId: string,
    state: TableState,
  ): Promise<{ result: ItemSupplierPriceDto[]; count: number }> {
    const fieldMap = SupplierItemPricesDomainService.ITEM_PRICE_FIELD_MAP;
    const where =
      and(FilterProcessor.buildWhere(state.filters, fieldMap), FilterProcessor.buildSearch(state.search, fieldMap)) ||
      undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, fieldMap);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findItemPricesAtSiteForTable(inventoryItemId, siteId, {
      where,
      orderBy,
      limit,
      offset,
    });
    return { result: result.map((row) => ItemSupplierPriceDto.fromItemRow(row)), count };
  }

  // A supplier item's price windows within a date range, a group per site — the chosen sites, else `siteIdsOf` the
  // supplier and every site with prices of its own — each its own prices, else the legal entity's, with the price in
  // force, the one it replaced and the next scheduled; unpaged, for charts. RLS limits a site workspace to its own rows
  async findPriceHistory(
    supplierItemId: string,
    context: FilterCondition[],
    siteIdsOf?: (supplierId: string) => Promise<string[]>,
  ): Promise<SupplierItemPriceHistoryDto> {
    const { supplierId } = await this.requirePriceContext(supplierItemId);

    const currency = conditionValue(context, 'currency') ?? null;
    if (!currency) return { currency, sites: [] };
    const where = FilterProcessor.buildWhere(context, SupplierItemPricesDomainService.PRICE_HISTORY_FIELD_MAP);
    const rows = await this.repository.findPriceHistory(supplierItemId, where);
    const legalEntityWindows: PriceWindowDto[] = [];
    const bySite = new Map<string, PriceWindowDto[]>();
    for (const row of rows) {
      const windows = row.siteId ? (bySite.get(row.siteId) ?? []) : legalEntityWindows;
      windows.push(PriceWindowDto.from(row));
      if (row.siteId) bySite.set(row.siteId, windows);
    }
    const picked = conditionValues(context, 'sites');
    const siteIds = picked.length
      ? picked
      : [...new Set([...((await siteIdsOf?.(supplierId)) ?? []), ...bySite.keys()])];
    const today = SupplierItemPricesDomainService.today();
    return {
      currency,
      sites: siteIds
        .map((siteId) => ({ siteId, windows: bySite.get(siteId) ?? legalEntityWindows }))
        .filter(({ windows }) => windows.length > 0)
        .map(({ siteId, windows }) => SitePriceHistoryDto.from(siteId, windows, today)),
    };
  }

  // An inventory item's price history at one site: a line per drawn supplier item in one currency and per one unit, where
  // `unitsPer` gives how many of that unit one of a supplier's unit holds — the caller owns unit conversion
  async findItemPriceHistoryAtSite(
    inventoryItemId: string,
    siteId: string,
    context: FilterCondition[],
    unitsPer: (uomId: string) => Promise<Decimal>,
  ): Promise<InventoryItemPriceHistoryDto> {
    const currency = conditionValue(context, 'currency') ?? null;
    if (!currency) return { currency, lines: [] };
    const where = FilterProcessor.buildWhere(context, SupplierItemPricesDomainService.ITEM_PRICE_HISTORY_FIELD_MAP);
    const priced = await this.repository.findItemPriceHistoryAtSite(inventoryItemId, siteId, where);

    const supplierIds = conditionValues(context, 'supplierIds');
    const charted = new Set(
      supplierIds.length
        ? supplierIds.slice(0, MAX_CHARTED_SUPPLIERS)
        : await this.defaultChartedSuppliers(inventoryItemId, siteId, priced),
    );
    const bySupplierItem = new Map<string, ItemPriceAtSiteRow[]>();
    for (const row of priced.filter((entry) => charted.has(entry.supplierId))) {
      const group = bySupplierItem.get(row.supplierItemId) ?? [];
      group.push(row);
      bySupplierItem.set(row.supplierItemId, group);
    }
    const itemsPerSupplier = new Map<string, number>();
    for (const [first] of bySupplierItem.values()) {
      itemsPerSupplier.set(first.supplierId, (itemsPerSupplier.get(first.supplierId) ?? 0) + 1);
    }

    const today = SupplierItemPricesDomainService.today();
    const lines: PriceHistoryLineDto[] = [];
    for (const [supplierItemId, group] of bySupplierItem) {
      const [first] = group;
      const factor = await unitsPer(first.uomId);
      // A supplier quoting the item in several units draws a line per unit, named by the unit it quotes
      const label =
        first.uomSymbol && (itemsPerSupplier.get(first.supplierId) ?? 0) > 1
          ? `${first.supplierName} (${first.uomSymbol})`
          : first.supplierName;
      lines.push(
        PriceHistoryLineDto.from(
          { id: supplierItemId, supplierId: first.supplierId, label },
          group.map((row) =>
            PriceWindowDto.from(row, SupplierItemPricesDomainService.perPrimary(row.unitPrice, factor)),
          ),
          today,
        ),
      );
    }
    return { currency, lines };
  }
  // Returns every supplier item's price standing for an inventory item at the context's site and day, cheapest per primary
  // unit first, and no rows without both
  async findItemPriceComparisonTable(
    inventoryItemId: string,
    state: TableState,
  ): Promise<{ result: ItemSupplierPriceComparisonDto[]; count: number }> {
    const day = state.filters.context.find((condition) => condition.field === 'asOf');
    const asOf =
      day?.operator === 'equals' && typeof day.value === 'string' && isMatch(day.value, 'yyyy-MM-dd')
        ? day.value
        : null;
    if (!asOf || !state.filters.context.some((condition) => condition.field === 'site'))
      return { result: [], count: 0 };

    const standing = this.comparisonsRepository.standingOn(asOf);
    const fieldMap = this.comparisonsRepository.fieldMap(standing);
    const sort = state.sort.length ? state.sort : SupplierItemPricesDomainService.COMPARISON_DEFAULT_SORT;
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.comparisonsRepository.findForTable({
      inventoryItemId,
      standing,
      where: and(
        FilterProcessor.buildWhere(state.filters, fieldMap),
        FilterProcessor.buildSearch(state.search, fieldMap),
      ),
      orderBy: FilterProcessor.buildOrderBy(sort, fieldMap),
      limit,
      offset,
    });
    return { result: result.map((row) => ItemSupplierPriceComparisonDto.from(row)), count };
  }

  // Adds a validity-dated price at each given site, or for the whole legal entity when none is given, delimiting the
  // open row of each (SAP ME11)
  async addPrice(
    dto: AddSupplierItemPriceDto,
    siteIds: string[],
    createdBy: string | null,
  ): Promise<CreateResponseDto<SupplierItemPriceDto[]>> {
    const context = await this.requirePriceContext(dto.supplierItemId);
    SupplierItemPricesDomainService.assertSupplierCurrency(context.currencyCodes, dto.unitPrice.currency, 'unitPrice');
    if (dto.mrpId) await this.assertMrpMatches(dto.mrpId, context, dto.unitPrice.currency);
    const carriedSiteIds = new Set(await this.repository.findCarriedSiteIds(dto.supplierItemId));
    if (siteIds.some((siteId) => !carriedSiteIds.has(siteId))) {
      throw new BadRequestException({
        label: 'Item Not At Site',
        detail: 'Prices can only be added for sites where this item is set up.',
        errors: [{ field: 'siteIds', message: 'Item is not set up at every selected site' }],
      });
    }

    const data: AddSupplierItemPriceInput = {
      unitPrice: majorToMinor(dto.unitPrice.value, dto.unitPrice.currency, 'unitPrice'),
      currencyCode: dto.unitPrice.currency,
      mrpId: dto.mrpId ?? null,
      schemeBuyQty: dto.schemeBuyQty ?? null,
      schemeFreeQty: dto.schemeFreeQty ?? null,
      taxInclusive: dto.taxInclusive ?? false,
      validFrom: dto.validFrom,
      validTo: dto.validTo ?? null,
      note: dto.note ?? null,
    };
    const strata: (string | null)[] = siteIds.length > 0 ? [...new Set(siteIds)] : [null];
    const rows = await this.database.runInTransaction(async () => {
      const created: SupplierItemPrice[] = [];
      for (const siteId of strata) {
        created.push(await this.applyPriceInsert(context, dto.supplierItemId, siteId, data, createdBy));
      }
      return created;
    });
    return {
      success: true,
      message:
        siteIds.length === 0
          ? 'Price added for all sites.'
          : rows.length === 1
            ? 'Price added successfully.'
            : `Price added for ${pluralize('site', rows.length, true)}.`,
      data: rows.map((row) => SupplierItemPriceDto.from(row)),
    };
  }

  // Updates a price row — only the end date of one in force, and only a site's own rows from a site workspace
  async updatePrice(dto: UpdateSupplierItemPriceDto, workspaceSiteId?: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findPriceById(dto.id);
    if (!existing) throw new NotFoundException('Price not found.');
    SupplierItemPricesDomainService.assertNotFromQuotation(existing);
    SupplierItemPricesDomainService.assertSiteOwns(existing, workspaceSiteId);

    const inForce = existing.validFrom <= SupplierItemPricesDomainService.today();
    const changesTerms =
      dto.unitPrice !== undefined ||
      dto.schemeBuyQty !== undefined ||
      dto.schemeFreeQty !== undefined ||
      dto.taxInclusive !== undefined ||
      dto.mrpId !== undefined;
    if (inForce && changesTerms) {
      throw new BadRequestException({
        label: 'Price In Force',
        detail: 'This price has already taken effect. Add a new price from a date instead, or set an end date.',
      });
    }

    const update: Partial<NewSupplierItemPrice> = {};
    const context = await this.requirePriceContext(existing.supplierItemId);
    if (dto.unitPrice !== undefined) {
      SupplierItemPricesDomainService.assertSupplierCurrency(
        context.currencyCodes,
        dto.unitPrice.currency,
        'unitPrice',
      );
      update.unitPrice = majorToMinor(dto.unitPrice.value, dto.unitPrice.currency, 'unitPrice');
      update.currencyCode = dto.unitPrice.currency;
    }
    const currencyCode = update.currencyCode ?? existing.currencyCode;
    if (dto.mrpId !== undefined) {
      if (dto.mrpId) await this.assertMrpMatches(dto.mrpId, context, currencyCode);
      update.mrpId = dto.mrpId;
    } else if (update.currencyCode && existing.mrpId) {
      await this.assertMrpMatches(existing.mrpId, context, currencyCode);
    }
    if (dto.schemeBuyQty !== undefined) update.schemeBuyQty = dto.schemeBuyQty;
    if (dto.schemeFreeQty !== undefined) update.schemeFreeQty = dto.schemeFreeQty;
    if (dto.taxInclusive !== undefined) update.taxInclusive = dto.taxInclusive;
    if (dto.validTo !== undefined) {
      if (dto.validTo && dto.validTo < existing.validFrom) {
        throw new BadRequestException({
          label: 'Invalid End Date',
          detail: 'The end date cannot be before the start date.',
          errors: [{ field: 'validTo', message: 'Before the start date' }],
        });
      }
      update.validTo = dto.validTo;
    }

    if (Object.keys(update).length === 0) {
      return { success: true, message: 'No changes to apply.' };
    }

    await this.repository.updatePriceRow(dto.id, update);
    return { success: true, message: 'Price updated successfully.' };
  }

  // Deletes a future price row, from a site workspace only its own, re-opening the contiguous prior row
  async deletePrice(id: string, workspaceSiteId?: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findPriceById(id);
    if (!existing) throw new NotFoundException('Price not found.');
    SupplierItemPricesDomainService.assertNotFromQuotation(existing);
    SupplierItemPricesDomainService.assertSiteOwns(existing, workspaceSiteId);
    if (existing.validFrom <= SupplierItemPricesDomainService.today()) {
      throw new BadRequestException({
        label: 'Price In Force',
        detail: 'Prices that have taken effect are kept as history. Set an end date instead of deleting.',
      });
    }

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

  // Delimit core (SAP ME11): rejects a later-or-equal row in the stratum, closes the open row, inserts.
  // Writes a quotation's lines as QUOTATION prices at a site, or for the legal entity when the site is empty, inside the
  // caller's transaction
  async postQuotationPrices(
    quotationSiteId: string,
    siteId: string | null,
    lines: QuotationPriceLine[],
    validity: { validFrom: string; validTo: string | null; note: string | null },
    createdBy: string | null,
  ): Promise<number> {
    for (const line of lines) {
      const { supplierItemId } = line;
      const context = await this.requirePriceContext(supplierItemId);
      const row = await this.applyPriceInsert(
        context,
        supplierItemId,
        siteId,
        {
          unitPrice: line.unitPrice,
          currencyCode: line.currencyCode,
          mrpId: line.mrpId,
          schemeBuyQty: line.schemeBuyQty,
          schemeFreeQty: line.schemeFreeQty,
          taxInclusive: line.taxInclusive,
          validFrom: validity.validFrom,
          validTo: validity.validTo,
          source: SupplierPriceSourceValues.QUOTATION,
          note: validity.note,
        },
        createdBy,
      );
      await this.repository.updatePriceRow(row.id, { quotationSiteId });
    }
    return lines.length;
  }

  // Removes a quotation's prices at a site as though it was never posted there: its rows are deleted — in force or
  // not — and the price each one had closed is stretched back over the gap. Runs inside the caller's transaction.
  async removeQuotationPrices(quotationSiteId: string): Promise<number> {
    const rows = await this.repository.findPricesByQuotationSite(quotationSiteId);
    for (const row of rows) {
      const prior = await this.repository.findContiguousPreviousPrice(row.supplierItemId, row.siteId, row.validFrom);
      const next = await this.repository.findNextPrice(row.supplierItemId, row.siteId, row.validFrom);
      await this.repository.deletePriceRow(row.id);
      if (prior) {
        await this.repository.updatePriceRow(prior.id, {
          validTo: next ? SupplierItemPricesDomainService.dayBefore(next.validFrom) : null,
        });
      }
    }
    return rows.length;
  }

  private async applyPriceInsert(
    context: PriceContext,
    supplierItemId: string,
    siteId: string | null,
    data: AddSupplierItemPriceInput,
    createdBy: string | null,
  ): Promise<SupplierItemPrice> {
    const conflict = await this.repository.hasPriceOnOrAfter(supplierItemId, siteId, data.validFrom);
    if (conflict) {
      throw new BadRequestException({
        label: 'Overlapping Price',
        detail: 'A price already exists on or after this start date. Remove or adjust it before adding a new one.',
        errors: [{ field: 'validFrom', message: 'A later price already exists' }],
      });
    }
    await this.repository.closeOpenPrice(supplierItemId, siteId, data.validFrom);
    return this.repository.insertPrice({
      legalEntityId: context.legalEntityId,
      siteId,
      supplierItemId,
      unitPrice: data.unitPrice,
      currencyCode: data.currencyCode,
      mrpId: data.mrpId ?? null,
      schemeBuyQty: data.schemeBuyQty ?? null,
      schemeFreeQty: data.schemeFreeQty ?? null,
      taxInclusive: data.taxInclusive ?? false,
      validFrom: data.validFrom,
      validTo: data.validTo ?? null,
      source: data.source ?? 'MANUAL',
      note: data.note ?? null,
      createdBy,
    });
  }

  // A price is in one of the currencies its supplier trades in
  private static assertSupplierCurrency(supplierCurrencies: string[], currencyCode: string, field: string): void {
    if (!supplierCurrencies.includes(currencyCode)) {
      throw new BadRequestException({
        label: 'Currency Not Accepted',
        detail: `This supplier trades in ${supplierCurrencies.join(', ')}, not ${currencyCode}.`,
        errors: [{ field, message: "Not one of the supplier's currencies" }],
      });
    }
  }

  private async requirePriceContext(supplierItemId: string): Promise<PriceContext> {
    const context = await this.repository.findPriceContext(supplierItemId);
    if (!context) throw new NotFoundException('Supplier item not found.');
    return context;
  }

  // An MRP on a price is the item's, printed for the supplier item's unit and in the price's currency
  private async assertMrpMatches(mrpId: string, context: PriceContext, currencyCode: string): Promise<void> {
    const mrp = await this.repository.findMrp(mrpId);
    if (
      !mrp ||
      mrp.inventoryItemId !== context.inventoryItemId ||
      mrp.uomId !== context.uomId ||
      mrp.currencyCode !== currencyCode
    ) {
      throw new BadRequestException({
        label: 'Invalid MRP',
        detail: "The MRP must belong to this item, in the supplier item's unit and the price's currency.",
        errors: [{ field: 'mrpId', message: 'Not an MRP of this item' }],
      });
    }
  }

  // A site reads the legal entity's prices but changes only its own; it overrides one by adding a price of its own
  private static assertSiteOwns(price: SupplierItemPrice, workspaceSiteId: string | undefined): void {
    if (!workspaceSiteId || price.siteId === workspaceSiteId) return;
    throw new BadRequestException({
      label: 'Legal Entity Price',
      detail: "This is the legal entity's price for all sites. Add a price for this site to override it.",
    });
  }

  // Prices a quotation posted change only through the quotation, so they always match it
  private static assertNotFromQuotation(price: SupplierItemPrice): void {
    if (!price.quotationSiteId) return;
    throw new BadRequestException({
      label: 'Quotation Price',
      detail: 'This price was posted by a quotation. Change the quotation or remove it from the site instead.',
    });
  }

  // The ISO calendar day before the given one
  // The suppliers a chart starts with when none are picked: those preferred at the site, then the most recently
  // priced, up to MAX_CHARTED_SUPPLIERS
  private async defaultChartedSuppliers(
    inventoryItemId: string,
    siteId: string,
    rows: ItemPriceAtSiteRow[],
  ): Promise<string[]> {
    const preferred = new Set(await this.repository.findPreferredSupplierItemIdsAtSite(inventoryItemId, siteId));
    const latest = new Map<string, { preferred: boolean; validFrom: string }>();
    for (const row of rows) {
      const seen = latest.get(row.supplierId);
      latest.set(row.supplierId, {
        preferred: (seen?.preferred ?? false) || preferred.has(row.supplierItemId),
        validFrom: seen && seen.validFrom > row.validFrom ? seen.validFrom : row.validFrom,
      });
    }
    return [...latest]
      .sort(([, a], [, b]) => Number(b.preferred) - Number(a.preferred) || b.validFrom.localeCompare(a.validFrom))
      .slice(0, MAX_CHARTED_SUPPLIERS)
      .map(([supplierId]) => supplierId);
  }

  // An amount per the item's primary unit, given how many primary units one quoted unit holds
  private static perPrimary(amount: bigint, factor: Decimal): bigint {
    return factor.lte(0)
      ? amount
      : BigInt(new Decimal(amount.toString()).dividedBy(factor).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0));
  }

  private static dayBefore(isoDate: string): string {
    const date = new Date(`${isoDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
  }

  // Today's date as an ISO calendar day (YYYY-MM-DD) for a new price's start
  private static today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
