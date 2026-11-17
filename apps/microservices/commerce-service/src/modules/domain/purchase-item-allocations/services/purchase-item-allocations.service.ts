import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import type { TableState } from '@vritti/api-sdk/data-table';
import Decimal from '@vritti/api-sdk/decimal';
import { asc } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException } from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import { CurrencyAmountDto, majorToMinor } from '@vritti/api-sdk/money';
import { pluralize } from '@vritti/api-sdk/pluralize';
import {
  computeFreeQty,
  type Purchase,
  type PurchaseItemAllocation,
  PurchaseLegStatusValues,
  PurchaseLegStepValues,
  PurchaseStatusValues,
  type PurchaseSupplier,
  purchaseItemAllocations,
  purchaseOrders,
  purchaseSuppliers,
} from '@/db/schema';
import { PurchaseAllocationDto } from '../dto/entity/purchase-allocation.dto';
import type { CreatePurchaseAllocationDto } from '../dto/request/create-purchase-allocation.dto';
import type { UpdatePurchaseAllocationDto } from '../dto/request/update-purchase-allocation.dto';
import type { AllocationPurchase } from '../repositories/purchase-item-allocations.repository';
import {
  type AllocationWithLegFilter,
  type AllocationWithLegRow,
  type PurchaseAllocationRow,
  PurchaseItemAllocationsDomainRepository,
  type PurchaseItemAllocationTableRow,
} from '../repositories/purchase-item-allocations.repository';

export type AllocationLeg = Pick<PurchaseSupplier, 'id' | 'step' | 'status'> & { allowsUnpriced: boolean };

type EditablePurchase = Pick<Purchase, 'status'>;

type EditableLeg = Pick<PurchaseSupplier, 'status' | 'step'>;

export interface AllocationContext {
  purchase: AllocationPurchase;
  leg: AllocationLeg;
  purchaseItemId: string;
  supplierCurrencies: string[];
}

export interface QuotedAllocation {
  context: AllocationContext;
  terms: QuotedAllocationTerms;
  quantity: AllocationQuantity;
}

export interface AllocationQuantity {
  uomQty: number;
  primaryUomQty: number;
}

export interface QuotedAllocationTerms {
  id: string;
  purchaseItemId: string | null;
  uomId: string;
  currencyCode: string;
  unitPrice: bigint;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
}

export interface PurchaseAllocationSourcing {
  currencyCodes: string[];
  total: bigint | null;
  unpricedCount: number;
}

export interface PurchaseLegSourcedTotal {
  sourcedTotal: CurrencyAmountDto;
  hasUnpricedAllocations: boolean;
}

type PricedAllocation = Pick<PurchaseItemAllocation, 'currencyCode' | 'unitPrice' | 'uomQty'>;

type AllocationScheme = Pick<PurchaseItemAllocation, 'schemeBuyQty' | 'schemeFreeQty' | 'hasScheme'>;

@Injectable()
export class PurchaseItemAllocationsDomainService {
  private readonly logger = new Logger(PurchaseItemAllocationsDomainService.name);

  constructor(private readonly repository: PurchaseItemAllocationsDomainRepository) {}

  // Allocates part of a purchase item to a leg at an entered price and scheme; the price may be left out only for a leg
  // its invoice prices, and is otherwise in one of the supplier's currencies
  async create(
    context: AllocationContext,
    dto: CreatePurchaseAllocationDto,
    quantity: AllocationQuantity,
    defaultCurrencyCode: string,
  ): Promise<PurchaseItemAllocation> {
    this.assertEditable(context);
    await this.assertNotAllocated(context, 'purchaseItemId');
    const currencyCode = dto.unitPrice?.currency ?? defaultCurrencyCode;
    this.assertTradesIn(context, currencyCode);
    const unitPrice = dto.unitPrice ? majorToMinor(dto.unitPrice.value, dto.unitPrice.currency, 'unitPrice') : null;
    this.assertPriced(context, unitPrice);
    const scheme = this.schemeOf(dto.schemeBuyQty ?? null, dto.schemeFreeQty ?? null);

    const allocation = await this.repository.create({
      purchaseItemId: context.purchaseItemId,
      purchaseSupplierId: context.leg.id,
      uomId: dto.uomId,
      ...quantity,
      currencyCode,
      unitPrice,
      ...scheme,
      freePrimaryQty: this.freePrimaryQty(quantity, scheme),
    });
    this.logger.log(
      `Allocated item ${context.purchaseItemId} to leg ${context.leg.id} on ${context.purchase.purchaseNumber}`,
    );
    return allocation;
  }

  // Allocates purchase items from quotation lines at the lines' unit, price and scheme in one insert, rejecting an item
  // already allocated to the line's supplier
  async createFromQuotation(lines: QuotedAllocation[]): Promise<void> {
    for (const line of lines) this.assertEditable(line.context);
    const existing = await this.repository.findForItemsOnLegs(
      lines.map((line) => line.context.purchaseItemId),
      lines.map((line) => line.context.leg.id),
    );
    const taken = new Set(
      existing.map((allocation) => `${allocation.purchaseItemId}:${allocation.purchaseSupplierId}`),
    );
    if (lines.some((line) => taken.has(`${line.context.purchaseItemId}:${line.context.leg.id}`))) {
      throw new ConflictException({
        label: 'Already Allocated',
        detail: 'An item is already allocated to the supplier. Edit that allocation instead.',
        errors: [{ field: 'supplierQuotationItemIds', message: 'Already allocated to this supplier' }],
      });
    }
    await this.repository.createMany(
      lines.map(({ context, terms, quantity }) => {
        const scheme = this.schemeOf(terms.schemeBuyQty, terms.schemeFreeQty);
        return {
          purchaseItemId: context.purchaseItemId,
          purchaseSupplierId: context.leg.id,
          supplierQuotationItemId: terms.id,
          uomId: terms.uomId,
          ...quantity,
          currencyCode: terms.currencyCode,
          unitPrice: terms.unitPrice,
          ...scheme,
          freePrimaryQty: this.freePrimaryQty(quantity, scheme),
        };
      }),
    );
    this.logger.log(`Allocated ${lines.length} quotation lines on ${lines[0]?.context.purchase.purchaseNumber}`);
  }

  // Changes an allocation's unit, quantity, price or scheme while its leg is in sourcing; on a purchase that requires
  // quotations only the quantity changes, and an allocation whose terms change no longer follows its quotation line
  async update(
    context: AllocationContext,
    allocation: PurchaseItemAllocation,
    dto: UpdatePurchaseAllocationDto,
    quantity: AllocationQuantity,
  ): Promise<void> {
    this.assertEditable(context);
    const isTermsChange =
      dto.uomId !== undefined ||
      dto.unitPrice !== undefined ||
      dto.schemeBuyQty !== undefined ||
      dto.schemeFreeQty !== undefined;
    if (isTermsChange && context.purchase.quotationsRequired) {
      throw new BadRequestException({
        label: 'Quoted Terms',
        detail: `"${context.purchase.purchaseNumber}" requires quotations, so an allocation keeps its quotation line's unit, price and scheme; only its quantity changes.`,
      });
    }
    const currencyCode = dto.unitPrice?.currency ?? allocation.currencyCode;
    this.assertTradesIn(context, currencyCode);
    const unitPrice = this.changedUnitPrice(allocation, dto);
    this.assertPriced(context, unitPrice);
    const scheme = this.schemeOf(
      dto.schemeBuyQty === undefined ? allocation.schemeBuyQty : dto.schemeBuyQty,
      dto.schemeFreeQty === undefined ? allocation.schemeFreeQty : dto.schemeFreeQty,
    );

    await this.repository.update(allocation.id, {
      supplierQuotationItemId: isTermsChange ? null : allocation.supplierQuotationItemId,
      uomId: dto.uomId ?? allocation.uomId,
      ...quantity,
      currencyCode,
      unitPrice,
      ...scheme,
      freePrimaryQty: this.freePrimaryQty(quantity, scheme),
    });
    this.logger.log(`Updated allocation ${allocation.id} on ${context.purchase.purchaseNumber}`);
  }

  // Points allocations at the PO lines they became, in the caller's transaction
  async linkOrderLines(links: { allocationId: string; purchaseOrderItemId: string }[]): Promise<void> {
    await this.repository.linkOrderLines(links);
  }

  // Returns one allocation of a purchase
  async findById(purchaseId: string, allocationId: string): Promise<PurchaseAllocationDto> {
    return PurchaseAllocationDto.from(await this.repository.findOnPurchaseOrThrow(purchaseId, allocationId));
  }

  // Returns every allocation of a purchase's items
  findByPurchaseId(purchaseId: string): Promise<PurchaseAllocationRow[]> {
    return this.repository.findByPurchaseId(purchaseId);
  }

  // Returns the allocations of a leg
  findByLegId(purchaseSupplierId: string): Promise<PurchaseItemAllocation[]> {
    return this.repository.findByLegId(purchaseSupplierId);
  }

  // Returns every allocation of the given legs with its item and unit names and its quotation number
  findByLegIds(purchaseSupplierIds: string[]): Promise<PurchaseAllocationRow[]> {
    return this.repository.findDetailByLegIds(purchaseSupplierIds);
  }

  // Returns every allocation of the given purchase items with its item and unit names and its quotation number
  findByItemIds(purchaseItemIds: string[]): Promise<PurchaseAllocationRow[]> {
    return this.repository.findDetailByItemIds(purchaseItemIds);
  }

  // Returns one page of a purchase item's allocations with the PO each became, narrowed and ordered by the table's state
  findForItemTable(
    purchaseId: string,
    itemId: string,
    state: TableState,
  ): Promise<{ result: PurchaseItemAllocationTableRow[]; count: number }> {
    const fieldMap: FieldMap = {
      supplierId: { column: purchaseSuppliers.supplierId, type: 'string' },
      poStatus: { column: purchaseOrders.status, type: 'string' },
      uomQty: { column: purchaseItemAllocations.uomQty, type: 'number' },
      primaryUomQty: { column: purchaseItemAllocations.primaryUomQty, type: 'number' },
    };
    const orderBy = FilterProcessor.buildOrderBy(state.sort, fieldMap);
    const { limit = 50, offset = 0 } = state.pagination;
    return this.repository.findForItemTable(purchaseId, itemId, {
      where: FilterProcessor.buildWhere(state.filters, fieldMap),
      orderBy: orderBy.length > 0 ? orderBy : [asc(purchaseItemAllocations.createdAt)],
      limit,
      offset,
    });
  }

  // Returns allocations narrowed by the filter with their purchase, leg, item tracking and units
  findWithLegs(filter: AllocationWithLegFilter): Promise<AllocationWithLegRow[]> {
    return this.repository.findWithLegs(filter);
  }

  // Sums a leg's allocations as Σ unit price × quantity in their one currency; the total is null when there are none,
  // any is unpriced or they are in more than one currency
  summarize(allocations: PricedAllocation[]): PurchaseAllocationSourcing {
    const currencyCodes = _.uniq(allocations.map((allocation) => allocation.currencyCode));
    const unpricedCount = allocations.filter((allocation) => allocation.unitPrice === null).length;
    if (allocations.length === 0 || unpricedCount > 0 || currencyCodes.length > 1) {
      return { currencyCodes, total: null, unpricedCount };
    }
    const total = allocations.reduce(
      (sum, allocation) => sum.plus(new Decimal((allocation.unitPrice ?? 0n).toString()).times(allocation.uomQty)),
      new Decimal(0),
    );
    return {
      currencyCodes,
      total: BigInt(total.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0)),
      unpricedCount,
    };
  }

  // Returns a leg's sourced total as money: Σ unit price × quantity of its priced allocations in their currency (zero
  // when they span currencies, zero in the fallback currency when it has none), and whether any is still unpriced
  sourcedTotal(allocations: PricedAllocation[], fallbackCurrencyCode: string): PurchaseLegSourcedTotal {
    const priced = allocations.filter(
      (allocation): allocation is PricedAllocation & { unitPrice: bigint } => allocation.unitPrice !== null,
    );
    const currencyCodes = _.uniq(priced.map((allocation) => allocation.currencyCode));
    const currencyCode = currencyCodes[0] ?? allocations[0]?.currencyCode ?? fallbackCurrencyCode;
    const total =
      currencyCodes.length > 1
        ? new Decimal(0)
        : priced.reduce(
            (sum, allocation) => sum.plus(new Decimal(allocation.unitPrice.toString()).times(allocation.uomQty)),
            new Decimal(0),
          );
    return {
      sourcedTotal: CurrencyAmountDto.from(
        BigInt(total.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0)),
        currencyCode,
      ),
      hasUnpricedAllocations: priced.length < allocations.length,
    };
  }

  // Keeps the quotation lines that quote a item line, rejecting any requested line that is not a posted, valid line of
  // the purchase's quotations or quotes no item line
  requireQuotedItems<TTerms extends QuotedAllocationTerms>(
    requestedIds: string[],
    terms: TTerms[],
  ): (TTerms & { purchaseItemId: string })[] {
    const quoted = terms.filter((term): term is TTerms & { purchaseItemId: string } => term.purchaseItemId !== null);
    const unavailableCount = _.uniq(requestedIds).length - quoted.length;
    if (unavailableCount === 0) return quoted;
    throw new BadRequestException({
      label: 'Quotation Lines Unavailable',
      detail: `${pluralize('chosen line', unavailableCount, true)} cannot be allocated: not on a quotation of this purchase posted to its site and valid today, or quoting none of its items.`,
      errors: [{ field: 'supplierQuotationItemIds', message: 'Not available to allocate' }],
    });
  }

  // Converts the requested primary quantity to whole units of a quotation line: rounds up to the next whole unit and
  // returns the primary quantity those units hold
  quotedQuantity(requestedPrimaryQty: number, primaryPerUnit: number): AllocationQuantity {
    if (primaryPerUnit <= 0) {
      throw new BadRequestException({
        label: 'Unit Too Small',
        detail: 'One unit of the quotation line holds less than the smallest primary quantity that can be recorded.',
        errors: [{ field: 'supplierQuotationItemIds', message: 'Unit cannot be converted' }],
      });
    }
    const uomQty = new Decimal(requestedPrimaryQty).dividedBy(primaryPerUnit).ceil();
    return {
      uomQty: uomQty.toNumber(),
      primaryUomQty: uomQty.times(primaryPerUnit).toDecimalPlaces(3, Decimal.ROUND_HALF_UP).toNumber(),
    };
  }

  // Whether an allocation on the leg may change: the purchase is open and the leg is still open in SOURCING
  isEditable(purchase: EditablePurchase, leg: EditableLeg): boolean {
    return this.isPurchaseSourcing(purchase) && this.isLegSourcing(leg);
  }

  // Removes an allocation while its leg is in sourcing, returning how many allocations the leg still has
  async remove(context: AllocationContext, allocation: PurchaseItemAllocation): Promise<number> {
    this.assertEditable(context);
    await this.repository.delete(allocation.id);
    this.logger.log(`Removed allocation ${allocation.id} from ${context.purchase.purchaseNumber}`);
    return this.repository.countByLeg(context.leg.id);
  }

  // Removes every allocation of a cancelled leg, in the caller's transaction, returning how much of each purchase item it
  // held in primary units
  async removeForLeg(legId: string): Promise<{ itemId: string; primaryQty: number }[]> {
    const allocations = await this.repository.findByLegId(legId);
    await this.repository.unlinkOrderLines(
      allocations.flatMap((allocation) => (allocation.purchaseOrderItemId ? [allocation.purchaseOrderItemId] : [])),
    );
    await this.repository.deleteByLegId(legId);
    this.logger.log(`Removed ${pluralize('allocation', allocations.length, true)} of cancelled leg ${legId}`);
    return allocations.map((allocation) => ({
      itemId: allocation.purchaseItemId,
      primaryQty: allocation.primaryUomQty,
    }));
  }

  // Frees the allocations of PO lines about to be deleted, in the caller's transaction
  async unlinkOrderLines(purchaseOrderItemIds: string[]): Promise<void> {
    await this.repository.unlinkOrderLines(purchaseOrderItemIds);
  }

  // Returns the unit price an update leaves: unchanged when not sent, cleared by null, otherwise the sent price
  private changedUnitPrice(allocation: PurchaseItemAllocation, dto: UpdatePurchaseAllocationDto): bigint | null {
    if (dto.unitPrice === undefined) return allocation.unitPrice;
    if (dto.unitPrice === null) return null;
    return majorToMinor(dto.unitPrice.value, dto.unitPrice.currency, 'unitPrice');
  }

  // Returns a scheme with both quantities or neither; hasScheme follows them
  private schemeOf(buyQty: number | null, freeQty: number | null): AllocationScheme {
    if ((buyQty === null) !== (freeQty === null)) {
      throw new BadRequestException({
        label: 'Incomplete Scheme',
        detail: 'A free-goods scheme needs both the quantity bought and the quantity free, or neither.',
        errors: [{ field: buyQty === null ? 'schemeBuyQty' : 'schemeFreeQty', message: 'Required with the other' }],
      });
    }
    return { schemeBuyQty: buyQty, schemeFreeQty: freeQty, hasScheme: buyQty !== null && freeQty !== null };
  }

  // Works out the free primary quantity the scheme earns on the allocated units
  private freePrimaryQty(quantity: AllocationQuantity, scheme: AllocationScheme): number {
    const freeQty = computeFreeQty(quantity.uomQty, scheme.schemeBuyQty, scheme.schemeFreeQty, scheme.hasScheme);
    return new Decimal(freeQty)
      .times(quantity.primaryUomQty)
      .dividedBy(quantity.uomQty)
      .toDecimalPlaces(3, Decimal.ROUND_HALF_UP)
      .toNumber();
  }

  // Rejects an allocation change unless the purchase is sourcing and the leg is still in SOURCING (409)
  private assertEditable(context: AllocationContext): void {
    const { purchase, leg } = context;
    if (!this.isPurchaseSourcing(purchase)) {
      throw new ConflictException({
        label: 'Allocations Locked',
        detail: `"${purchase.purchaseNumber}" is ${purchase.status.toLowerCase()}, so its allocations cannot change.`,
      });
    }
    if (!this.isLegSourcing(leg)) {
      throw new ConflictException({
        label: 'Allocations Locked',
        detail:
          'This supplier is past sourcing, so its allocations are locked; they open again only if its approval is rejected.',
      });
    }
  }

  // Whether the purchase is open, where its allocations may change
  private isPurchaseSourcing(purchase: EditablePurchase): boolean {
    return purchase.status === PurchaseStatusValues.OPEN;
  }

  // Whether the leg is still open in SOURCING, before it is submitted
  private isLegSourcing(leg: EditableLeg): boolean {
    return leg.status === PurchaseLegStatusValues.OPEN && leg.step === PurchaseLegStepValues.SOURCING;
  }

  // Rejects a second allocation of the same purchase item to the same leg; the existing one is edited instead
  private async assertNotAllocated(context: AllocationContext, field: string): Promise<void> {
    const existing = await this.repository.findForItemAndLeg(context.purchaseItemId, context.leg.id);
    if (!existing) return;
    throw new ConflictException({
      label: 'Already Allocated',
      detail: 'This item is already allocated to the supplier. Edit that allocation instead.',
      errors: [{ field, message: 'Already allocated to this supplier' }],
    });
  }

  // Rejects a currency the supplier does not trade in
  private assertTradesIn(context: AllocationContext, currencyCode: string): void {
    if (context.supplierCurrencies.includes(currencyCode)) return;
    throw new BadRequestException({
      label: 'Currency Not Accepted',
      detail: `This supplier trades in ${context.supplierCurrencies.join(', ')}, not ${currencyCode}.`,
      errors: [{ field: 'unitPrice', message: "Not one of the supplier's currencies" }],
    });
  }

  // Rejects a missing unit price on a leg its invoice does not price
  private assertPriced(context: AllocationContext, unitPrice: bigint | null): void {
    if (unitPrice !== null || context.leg.allowsUnpriced) return;
    throw new BadRequestException({
      label: 'Unit Price Required',
      detail: 'Enter a unit price; only direct purchases may leave it to the supplier invoice.',
      errors: [{ field: 'unitPrice', message: 'Required for this supplier' }],
    });
  }
}
