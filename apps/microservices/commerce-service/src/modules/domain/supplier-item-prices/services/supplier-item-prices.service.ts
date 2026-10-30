import { Injectable } from '@nestjs/common';
import {
  type FieldMap,
  type FilterCondition,
  FilterOperators,
  FilterProcessor,
  type TableViewState,
} from '@vritti/api-sdk/data-table';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import Decimal from '@vritti/api-sdk/decimal';
import { and } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { CurrencyAmountDto, majorToMinor } from '@vritti/api-sdk/money';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
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
  ItemSupplierPriceHistoryDto,
  PriceWindowDto,
  SitePriceHistoryDto,
  type SupplierItemPriceHistoryDto,
} from '../dto/entity/supplier-item-price-history.dto';
import type { AddSupplierItemPriceDto } from '../dto/request/add-supplier-item-price.dto';
import type { UpdateSupplierItemPriceDto } from '../dto/request/update-supplier-item-price.dto';
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

// A supplier item's validity-dated prices per site (SAP ME11 style): each new price closes the open one, prices in force
// are frozen, and a quotation's prices change only through the quotation
@Injectable()
export class SupplierItemPricesDomainService {
  // Field map for the supplier item price timeline table
  private static readonly PRICE_FIELD_MAP: FieldMap = {
    unitPrice: { column: supplierItemPrices.unitPrice, type: 'number' },
    validFrom: { column: supplierItemPrices.validFrom, type: 'string' },
    validTo: { column: supplierItemPrices.validTo, type: 'string' },
    source: { column: supplierItemPrices.source, type: 'string' },
  };

  // Field map for an inventory item's prices from every supplier at a site
  private static readonly ITEM_PRICE_FIELD_MAP: FieldMap = {
    ...SupplierItemPricesDomainService.PRICE_FIELD_MAP,
    supplierName: { column: parties.displayName, type: 'string' },
    supplierCode: { column: suppliers.code, type: 'string' },
    uomSymbol: { column: uom.symbol, type: 'string' },
  };

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly repository: SupplierItemPricesDomainRepository,
  ) {}

  // Returns a site's price prefill for a (supplier, item, uom)
  async findItemPrice(
    supplierId: string,
    inventoryItemId: string,
    uomId: string,
    siteId: string,
  ): Promise<{
    unitPrice: CurrencyAmountDto | null;
    schemeBuyQty: number | null;
    schemeFreeQty: number | null;
    taxInclusive: boolean;
  }> {
    const resolved = await this.repository.resolvePriceFor(supplierId, inventoryItemId, uomId, siteId);
    return {
      unitPrice: resolved ? CurrencyAmountDto.from(resolved.unitPrice, resolved.currencyCode) : null,
      schemeBuyQty: resolved?.schemeBuyQty ?? null,
      schemeFreeQty: resolved?.schemeFreeQty ?? null,
      taxInclusive: resolved?.taxInclusive ?? false,
    };
  }

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

  // Returns the paginated price timeline of a supplier item — one site's rows, or every site's when none is given
  async findPricesForTable(
    supplierItemId: string,
    siteId: string | null,
    state: TableViewState,
  ): Promise<{ result: SupplierItemPriceDto[]; count: number }> {
    await this.requirePriceContext(supplierItemId);

    const filterWhere = FilterProcessor.buildWhere(state.filters, SupplierItemPricesDomainService.PRICE_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, SupplierItemPricesDomainService.PRICE_FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, SupplierItemPricesDomainService.PRICE_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findPricesForTable(supplierItemId, siteId, {
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
    state: TableViewState,
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

  // Every price window of a supplier item grouped by site, with each site's price in force, the one it replaced and
  // the next scheduled — unpaged, for charts; RLS limits a site workspace to its own rows
  async findPriceHistory(
    supplierItemId: string,
    options: { siteIds?: string[]; from?: string; to?: string },
  ): Promise<SupplierItemPriceHistoryDto> {
    await this.requirePriceContext(supplierItemId);

    const bySite = new Map<string, PriceWindowDto[]>();
    for (const row of await this.repository.findPriceHistory(supplierItemId, options)) {
      const windows = bySite.get(row.siteId) ?? [];
      windows.push(PriceWindowDto.from(row));
      bySite.set(row.siteId, windows);
    }
    const today = SupplierItemPricesDomainService.today();
    return {
      sites: [...bySite].map(([siteId, windows]) => SitePriceHistoryDto.from(siteId, windows, today)),
    };
  }

  // The sites where any supplier has priced an inventory item
  findSiteIdsWithItemPrices(inventoryItemId: string): Promise<string[]> {
    return this.repository.findSiteIdsWithItemPrices(inventoryItemId);
  }

  // Every supplier's prices for an inventory item at one site, converted to the item's primary unit so suppliers
  // quoting a strip and a box of ten compare like for like. `unitsPerPrimary` gives how many primary units one of a
  // supplier's unit holds; the caller owns unit conversion.
  async findItemPriceHistoryAtSite(
    inventoryItemId: string,
    siteId: string,
    options: { from?: string; to?: string; supplierIds?: string[]; mrpIds?: string[] },
    unitsPerPrimary: (uomId: string) => Promise<number>,
  ): Promise<{ suppliers: ItemSupplierPriceHistoryDto[]; supplierCount: number }> {
    const inWindow = await this.repository.findItemPriceHistoryAtSite(inventoryItemId, siteId, options);
    const supplierCount = new Set(inWindow.map((row) => row.supplierId)).size;
    const charted = new Set(
      options.supplierIds?.length
        ? options.supplierIds.slice(0, MAX_CHARTED_SUPPLIERS)
        : await this.defaultChartedSuppliers(inventoryItemId, siteId, inWindow),
    );
    const rows = inWindow.filter((row) => charted.has(row.supplierId));
    const bySupplierItem = new Map<string, ItemPriceAtSiteRow[]>();
    for (const row of rows) {
      const group = bySupplierItem.get(row.supplierItemId) ?? [];
      group.push(row);
      bySupplierItem.set(row.supplierItemId, group);
    }

    const today = SupplierItemPricesDomainService.today();
    const histories: ItemSupplierPriceHistoryDto[] = [];
    for (const [supplierItemId, group] of bySupplierItem) {
      const [first] = group;
      const factor = new Decimal(await unitsPerPrimary(first.uomId));
      const perPrimary = (amount: bigint) => SupplierItemPricesDomainService.perPrimary(amount, factor);
      histories.push(
        ItemSupplierPriceHistoryDto.from(
          {
            supplierId: first.supplierId,
            supplierItemId,
            supplierName: first.supplierName,
            supplierCode: first.supplierCode,
            quotedUomSymbol: first.uomSymbol ?? null,
          },
          group.map((row) => PriceWindowDto.from(row, perPrimary(row.unitPrice))),
          today,
        ),
      );
    }
    return { suppliers: histories, supplierCount };
  }

  // Every supplier item's standing for an inventory item at a site on a date (today by default), as a table: the price
  // in force per its own unit and per the item's primary unit, what its scheme makes it cost, and how it last moved. The per-unit and
  // scheme figures are Decimal arithmetic, so the rows — one per supplier item of one item at one site — are filtered,
  // sorted and paged here rather than in SQL. Sorts cheapest effective price first by default.
  async findItemPriceComparisonTable(
    inventoryItemId: string,
    siteId: string,
    state: TableViewState,
    unitsPerPrimary: (uomId: string) => Promise<number>,
    asOf?: string,
  ): Promise<{ result: ItemSupplierPriceComparisonDto[]; count: number }> {
    const rows = await this.repository.findItemPriceHistoryAtSite(inventoryItemId, siteId, {});
    const preferred = new Set(await this.repository.findPreferredSupplierItemIdsAtSite(inventoryItemId, siteId));
    const bySupplierItem = new Map<string, ItemPriceAtSiteRow[]>();
    for (const row of rows) {
      const group = bySupplierItem.get(row.supplierItemId) ?? [];
      group.push(row);
      bySupplierItem.set(row.supplierItemId, group);
    }

    const today = asOf ?? SupplierItemPricesDomainService.today();
    const all: ItemSupplierPriceComparisonDto[] = [];
    for (const [supplierItemId, windows] of bySupplierItem) {
      const [first] = windows;
      const factor = new Decimal(await unitsPerPrimary(first.uomId));
      const currentIndex = windows.findIndex(
        (window) => window.validFrom <= today && (!window.validTo || window.validTo >= today),
      );
      const current = currentIndex >= 0 ? windows[currentIndex] : null;
      const previous = currentIndex > 0 ? windows[currentIndex - 1] : null;
      const perPrimary = current ? SupplierItemPricesDomainService.perPrimary(current.unitPrice, factor) : null;
      const afterScheme = (amount: bigint | null) =>
        amount != null && current?.schemeBuyQty && current.schemeFreeQty
          ? SupplierItemPricesDomainService.afterScheme(amount, current.schemeBuyQty, current.schemeFreeQty)
          : amount;
      const effective = afterScheme(perPrimary);
      const changePercent =
        current && previous && previous.currencyCode === current.currencyCode && previous.unitPrice > 0n
          ? new Decimal((current.unitPrice - previous.unitPrice).toString())
              .dividedBy(previous.unitPrice.toString())
              .times(100)
              .toDecimalPlaces(1, Decimal.ROUND_HALF_UP)
              .toNumber()
          : null;
      const money = (amount: bigint | null, currency: string | undefined) =>
        amount != null && currency ? CurrencyAmountDto.from(amount, currency) : null;

      const dto = new ItemSupplierPriceComparisonDto();
      Object.assign(dto, {
        supplierItemId,
        supplierId: first.supplierId,
        supplierName: first.supplierName,
        supplierCode: first.supplierCode,
        quotedUomSymbol: first.uomSymbol ?? null,
        isPreferred: preferred.has(supplierItemId),
        currentPrice: money(current?.unitPrice ?? null, current?.currencyCode),
        currentFrom: current?.validFrom ?? null,
        currentTo: current?.validTo ?? null,
        effectivePrice: money(afterScheme(current?.unitPrice ?? null), current?.currencyCode),
        pricePerPrimary: money(perPrimary, current?.currencyCode),
        effectivePricePerPrimary: money(effective, current?.currencyCode),
        schemeBuyQty: current?.schemeBuyQty ?? null,
        schemeFreeQty: current?.schemeFreeQty ?? null,
        mrp: money(current?.mrpAmount ?? null, current?.currencyCode),
        previousPrice: money(previous?.unitPrice ?? null, previous?.currencyCode),
        changePercent,
        priceCount: windows.length,
      });
      all.push(dto);
    }

    const matching = all.filter(
      (row) =>
        SupplierItemPricesDomainService.matchesComparisonSearch(row, state.search) &&
        (state.filters ?? []).every((filter) => SupplierItemPricesDomainService.matchesComparisonFilter(row, filter)),
    );
    const [sort] = state.sort?.length ? state.sort : [{ field: 'effectivePricePerPrimary', direction: 'asc' as const }];
    matching.sort((a, b) => SupplierItemPricesDomainService.compareComparisonRows(a, b, sort.field, sort.direction));
    const { limit = 20, offset = 0 } = state.pagination;
    return { result: matching.slice(offset, offset + limit), count: matching.length };
  }

  // Adds a validity-dated price at each given site, delimiting that site's open row (SAP ME11)
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
    const rows = await this.database.runInTransaction(async () => {
      const created: SupplierItemPrice[] = [];
      for (const siteId of [...new Set(siteIds)]) {
        created.push(await this.applyPriceInsert(context, dto.supplierItemId, siteId, data, createdBy));
      }
      return created;
    });
    return {
      success: true,
      message:
        rows.length === 1 ? 'Price added successfully.' : `Price added for ${pluralize('site', rows.length, true)}.`,
      data: rows.map((row) => SupplierItemPriceDto.from(row)),
    };
  }

  // Updates a price row. A row in force is frozen except for its end date; a future row can still be corrected.
  async updatePrice(dto: UpdateSupplierItemPriceDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findPriceById(dto.id);
    if (!existing) throw new NotFoundException('Price not found.');
    SupplierItemPricesDomainService.assertNotFromQuotation(existing);

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

  // Deletes a future price row; re-opens the contiguous prior row when the newest row is removed
  async deletePrice(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findPriceById(id);
    if (!existing) throw new NotFoundException('Price not found.');
    SupplierItemPricesDomainService.assertNotFromQuotation(existing);
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
  // Writes a quotation's lines at a site as source-QUOTATION prices; each closes the site's open price like a manual
  // one. Runs inside the caller's transaction.
  async postQuotationPrices(
    quotationSiteId: string,
    siteId: string,
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
    siteId: string,
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

  // What an amount costs once a buy+free scheme is counted in: amount × buy ÷ (buy + free)
  private static afterScheme(amount: bigint, buyQty: number, freeQty: number): bigint {
    return BigInt(
      new Decimal(amount.toString())
        .times(buyQty)
        .dividedBy(new Decimal(buyQty).plus(freeQty))
        .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
        .toFixed(0),
    );
  }

  // An amount per the item's primary unit, given how many primary units one quoted unit holds
  private static perPrimary(amount: bigint, factor: Decimal): bigint {
    return factor.lte(0)
      ? amount
      : BigInt(new Decimal(amount.toString()).dividedBy(factor).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0));
  }

  private static matchesComparisonSearch(
    row: ItemSupplierPriceComparisonDto,
    search: TableViewState['search'],
  ): boolean {
    if (!search?.value) return true;
    const needle = search.value.toLowerCase();
    const fields =
      search.columnId === 'supplierCode'
        ? [row.supplierCode]
        : search.columnId === 'supplierName'
          ? [row.supplierName]
          : [row.supplierName, row.supplierCode, row.quotedUomSymbol ?? ''];
    return fields.some((field) => field.toLowerCase().includes(needle));
  }

  // The comparison table's filters: preferred, in force today, has a scheme (true / false), and the currency in force
  private static matchesComparisonFilter(row: ItemSupplierPriceComparisonDto, filter: FilterCondition): boolean {
    const values = (Array.isArray(filter.value) ? filter.value : [filter.value]).map(String);
    const negate = filter.operator === FilterOperators.NOT_EQUALS || filter.operator === FilterOperators.IS_NOT_ANY_OF;
    const flag = (actual: boolean) => (values[0] === 'true') === actual;
    let matches: boolean;
    switch (filter.field) {
      case 'isPreferred':
        matches = flag(row.isPreferred);
        break;
      case 'inForce':
        matches = flag(row.currentPrice != null);
        break;
      case 'hasScheme':
        matches = flag(row.schemeBuyQty != null && row.schemeFreeQty != null);
        break;
      case 'currency':
        matches = row.currentPrice != null && values.includes(row.currentPrice.currency);
        break;
      default:
        return true;
    }
    return matches !== negate;
  }

  // Orders comparison rows on one column; rows without a value sort last either way, and money compares within a
  // currency before across currencies
  private static compareComparisonRows(
    a: ItemSupplierPriceComparisonDto,
    b: ItemSupplierPriceComparisonDto,
    field: string,
    direction: 'asc' | 'desc',
  ): number {
    const value = (row: ItemSupplierPriceComparisonDto): string | number | null => {
      const raw = (row as unknown as Record<string, unknown>)[field];
      if (raw == null) return null;
      if (typeof raw === 'object' && 'value' in (raw as object)) return Number((raw as CurrencyAmountDto).value);
      if (typeof raw === 'boolean') return raw ? 1 : 0;
      return raw as string | number;
    };
    const currencyOf = (row: ItemSupplierPriceComparisonDto) =>
      ((row as unknown as Record<string, { currency?: string } | null>)[field]?.currency ?? '') as string;
    const left = value(a);
    const right = value(b);
    if (left == null || right == null) return left == null ? (right == null ? 0 : 1) : -1;
    const byCurrency = currencyOf(a).localeCompare(currencyOf(b));
    if (byCurrency !== 0) return byCurrency;
    const order =
      typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right));
    return direction === 'desc' ? -order : order;
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
