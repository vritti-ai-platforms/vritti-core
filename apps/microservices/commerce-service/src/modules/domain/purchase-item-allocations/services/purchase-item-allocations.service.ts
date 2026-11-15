import { Injectable, Logger } from '@nestjs/common';
import Decimal from '@vritti/api-sdk/decimal';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
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
  PurchaseStepValues,
  type PurchaseSupplier,
} from '@/db/schema';
import { PurchaseAllocationDto } from '../dto/entity/purchase-allocation.dto';
import type { CreatePurchaseAllocationDto } from '../dto/request/create-purchase-allocation.dto';
import type { UpdatePurchaseAllocationDto } from '../dto/request/update-purchase-allocation.dto';
import {
  type AllocationWithLegFilter,
  type AllocationWithLegRow,
  type PurchaseAllocationRow,
  PurchaseItemAllocationsDomainRepository,
} from '../repositories/purchase-item-allocations.repository';

export type AllocationPurchase = Pick<Purchase, 'id' | 'purchaseNumber' | 'status' | 'step' | 'quotationsRequired'>;

export type AllocationLeg = Pick<PurchaseSupplier, 'id' | 'step' | 'status'> & { allowsUnpriced: boolean };

type EditablePurchase = Pick<Purchase, 'status' | 'step'>;

type EditableLeg = Pick<PurchaseSupplier, 'status' | 'step'>;

export interface AllocationContext {
  purchase: AllocationPurchase;
  leg: AllocationLeg;
  purchaseItemId: string;
  supplierCurrencies: string[];
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

  // Allocates a purchase item to a leg on the terms of a posted quotation line: its unit, currency, price and scheme
  async createFromQuotation(
    context: AllocationContext,
    terms: QuotedAllocationTerms,
    quantity: AllocationQuantity,
  ): Promise<PurchaseItemAllocation> {
    this.assertEditable(context);
    await this.assertNotAllocated(context, 'supplierQuotationItemIds');
    const scheme = this.schemeOf(terms.schemeBuyQty, terms.schemeFreeQty);

    const allocation = await this.repository.create({
      purchaseItemId: context.purchaseItemId,
      purchaseSupplierId: context.leg.id,
      supplierQuotationItemId: terms.id,
      uomId: terms.uomId,
      ...quantity,
      currencyCode: terms.currencyCode,
      unitPrice: terms.unitPrice,
      ...scheme,
      freePrimaryQty: this.freePrimaryQty(quantity, scheme),
    });
    this.logger.log(
      `Allocated item ${context.purchaseItemId} from quotation line ${terms.id} on ${context.purchase.purchaseNumber}`,
    );
    return allocation;
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
    return PurchaseAllocationDto.from(await this.findOnPurchaseOrThrow(purchaseId, allocationId));
  }

  // Returns every allocation of a purchase's items
  findByPurchaseId(purchaseId: string): Promise<PurchaseAllocationRow[]> {
    return this.repository.findByPurchaseId(purchaseId);
  }

  // Returns the allocations of a leg
  findByLegId(purchaseSupplierId: string): Promise<PurchaseItemAllocation[]> {
    return this.repository.findByLegId(purchaseSupplierId);
  }

  // Returns allocations narrowed by the filter with their purchase, leg, item tracking and units
  findWithLegs(filter: AllocationWithLegFilter): Promise<AllocationWithLegRow[]> {
    return this.repository.findWithLegs(filter);
  }

  // Returns the unit price an allocation is ordered at, rejecting one without a price and naming its item
  requireUnitPrice(allocation: Pick<PurchaseItemAllocation, 'unitPrice'> & { inventoryItemName: string }): bigint {
    if (allocation.unitPrice !== null) return allocation.unitPrice;
    throw new BadRequestException({
      label: 'Price Missing',
      detail: `"${allocation.inventoryItemName}" has no unit price on its allocation. Price it before ordering.`,
    });
  }

  // Loads an allocation of the given purchase, throwing when it is not on it
  async findOnPurchaseOrThrow(purchaseId: string, allocationId: string): Promise<PurchaseAllocationRow> {
    const allocation = await this.repository.findDetailOnPurchase(purchaseId, allocationId);
    if (!allocation) throw new NotFoundException('Allocation not found.');
    return allocation;
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
  // when they span currencies), and whether any allocation is still unpriced
  sourcedTotal(allocations: PricedAllocation[]): PurchaseLegSourcedTotal {
    const priced = allocations.filter(
      (allocation): allocation is PricedAllocation & { unitPrice: bigint } => allocation.unitPrice !== null,
    );
    const currencyCodes = _.uniq(priced.map((allocation) => allocation.currencyCode));
    const currencyCode = currencyCodes[0] ?? allocations[0]?.currencyCode ?? '';
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

  // Rejects an entered allocation on a purchase that requires quotations; its allocations come from quotation lines
  assertEnteredAllowed(purchase: AllocationPurchase): void {
    if (!purchase.quotationsRequired) return;
    throw new BadRequestException({
      label: 'Allocate From Quotations',
      detail: `"${purchase.purchaseNumber}" requires quotations, so its items are allocated from posted quotation lines.`,
    });
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

  // Whether an allocation on the leg may change: the purchase is sourcing and the leg is still open in SOURCING
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
        detail: `"${purchase.purchaseNumber}" is not sourcing, so its allocations cannot change.`,
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

  // Whether the purchase is open in SOURCING or PROCURING, where its allocations may change
  private isPurchaseSourcing(purchase: EditablePurchase): boolean {
    const isSourcing = purchase.step === PurchaseStepValues.SOURCING || purchase.step === PurchaseStepValues.PROCURING;
    return purchase.status === PurchaseStatusValues.OPEN && isSourcing;
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
