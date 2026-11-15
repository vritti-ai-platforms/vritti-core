import { Injectable, Logger } from '@nestjs/common';
import Decimal from '@vritti/api-sdk/decimal';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import { type CurrencyCode, convertMinor, minorToMajor } from '@vritti/api-sdk/money';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import {
  computeFreeQty,
  type NewSupplierInvoiceHold,
  type SupplierInvoice,
  type SupplierInvoiceHold,
  type SupplierInvoiceHoldCode,
  SupplierInvoiceHoldCodeValues,
  SupplierInvoiceHoldStatusValues,
} from '@/db/schema';
import { PurchaseOrderInvoiceHoldDto } from '../dto/entity/purchase-order-invoice-hold.dto';
import type { ReleaseSupplierInvoiceHoldDto } from '../dto/request/release-supplier-invoice-hold.dto';
import {
  type HoldInvoiceFacts,
  type HoldLineFacts,
  SupplierInvoiceHoldsDomainRepository,
} from '../repositories/supplier-invoice-holds.repository';
import { SupplierInvoicesDomainRepository } from '../repositories/supplier-invoices.repository';

export const MIN_SHELF_LIFE_DAYS = 180;

export interface ComputedHold {
  supplierInvoiceLineId: string | null;
  code: SupplierInvoiceHoldCode;
  detail: string;
  blocksPayment: boolean;
}

export interface HoldChanges {
  inserts: NewSupplierInvoiceHold[];
  updates: { id: string; changes: Partial<NewSupplierInvoiceHold> }[];
}

@Injectable()
export class SupplierInvoiceHoldsDomainService {
  private readonly logger = new Logger(SupplierInvoiceHoldsDomainService.name);

  constructor(
    private readonly repository: SupplierInvoiceHoldsDomainRepository,
    private readonly invoicesRepository: SupplierInvoicesDomainRepository,
  ) {}

  // Recomputes an invoice's holds from its own lines, in the caller's transaction, and caches its open blocking count
  async sync(supplierInvoiceId: string, leCurrencyCode: string): Promise<number> {
    const invoice = await this.findInvoiceFactsOrThrow(supplierInvoiceId);
    const lines = await this.repository.findLineFacts(supplierInvoiceId);
    const existing = await this.repository.findByInvoice(supplierInvoiceId);
    const { inserts, updates } = this.plan(supplierInvoiceId, existing, this.evaluate(invoice, lines, leCurrencyCode));

    await this.repository.insertMany(inserts);
    for (const update of updates) await this.repository.update(update.id, update.changes);
    const openHoldCount = await this.repository.countOpenBlocking(supplierInvoiceId);
    await this.invoicesRepository.setOpenHoldCount(supplierInvoiceId, openHoldCount);
    if (inserts.length > 0 || updates.length > 0) {
      this.logger.log(`Supplier invoice ${supplierInvoiceId} holds synced — ${openHoldCount} open blocking`);
    }
    return openHoldCount;
  }

  // Evaluates the hold causes of an invoice's item lines against their PO lines, receipts and the enrollment's tolerances
  evaluate(invoice: HoldInvoiceFacts, lines: HoldLineFacts[], leCurrencyCode: string): ComputedHold[] {
    const money = (minor: bigint, currencyCode: string) =>
      `${currencyCode} ${minorToMajor(minor, currencyCode as CurrencyCode)}`;
    const holds: ComputedHold[] = [];
    const linesByOrderLine = _.groupBy(lines, 'purchaseOrderItemId');

    for (const line of lines) {
      const onLine = (code: SupplierInvoiceHoldCode, detail: string, blocksPayment = true) =>
        holds.push({ supplierInvoiceLineId: line.supplierInvoiceLineId, code, detail, blocksPayment });
      const orderLineLines = linesByOrderLine[line.purchaseOrderItemId];

      // Price: beyond the percentage tolerance and the amount tolerance (in the legal entity's currency) both
      const priceDifference = line.unitPrice - line.poUnitPrice;
      if (priceDifference !== 0n) {
        const absoluteDifference = priceDifference < 0n ? -priceDifference : priceDifference;
        const exceedsPercent =
          line.poUnitPrice === 0n ||
          new Decimal(absoluteDifference.toString())
            .div(line.poUnitPrice.toString())
            .times(100)
            .gt(invoice.priceTolerancePct);
        const lineDifference = BigInt(
          new Decimal(absoluteDifference.toString())
            .times(line.invoicedQty)
            .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
            .toFixed(0),
        );
        const exceedsAmount =
          convertMinor(lineDifference, invoice.currencyCode, leCurrencyCode, invoice.exchangeRate) >
          invoice.amountTolerance;
        if (exceedsPercent && exceedsAmount) {
          onLine(
            SupplierInvoiceHoldCodeValues.PRICE_DIFFERS,
            `${line.poNumber} prices it at ${money(line.poUnitPrice, invoice.currencyCode)}, the invoice at ${money(line.unitPrice, invoice.currencyCode)}.`,
          );
        }
      }

      // Quantity: invoiced + free on posted invoices and this one beyond the PO line's due quantity and its tolerance
      const invoicedHere = orderLineLines.reduce(
        (total, other) => total.plus(other.invoicedPrimaryQty).plus(other.freePrimaryQty),
        new Decimal(0),
      );
      const invoicedInAll = invoicedHere.plus(line.otherPostedInvoicedPrimaryQty);
      const due = new Decimal(line.poPrimaryUomQty).plus(line.poFreePrimaryQty).minus(line.poCancelledPrimaryQty);
      if (invoicedInAll.gt(due.times(new Decimal(100).plus(invoice.qtyTolerancePct)).div(100))) {
        onLine(
          SupplierInvoiceHoldCodeValues.INVOICED_MORE_THAN_ORDERED,
          `${invoicedInAll.toString()} primary units of ${line.poNumber} invoiced with free goods across invoices, ${due.toString()} due on the order.`,
        );
      }

      // Free goods: what this invoice invoices free on the PO line against what its scheme gives on what it invoices
      const invoicedQtyHere = orderLineLines.reduce((total, other) => total.plus(other.invoicedQty), new Decimal(0));
      const freeQtyHere = orderLineLines.reduce((total, other) => total.plus(other.freeQty), new Decimal(0));
      const schemeFreeQty = computeFreeQty(
        invoicedQtyHere.toNumber(),
        line.schemeBuyQty,
        line.schemeFreeQty,
        line.hasScheme,
      );
      if (freeQtyHere.lt(schemeFreeQty)) {
        onLine(
          SupplierInvoiceHoldCodeValues.FREE_SHORT,
          `Free ${freeQtyHere.toString()} on ${line.poNumber}; the scheme gives ${schemeFreeQty} on ${invoicedQtyHere.toString()} invoiced.`,
        );
      }

      // Rate: the invoice converts at another rate than the PO line's order
      if (!new Decimal(invoice.exchangeRate).eq(line.poExchangeRate)) {
        onLine(
          SupplierInvoiceHoldCodeValues.RATE_DIFFERS,
          `${line.poNumber} converts at ${line.poExchangeRate}, the invoice at ${invoice.exchangeRate}.`,
        );
      }

      // Shelf life: the invoiced lot had less than the minimum left when it was received; information only
      if (line.lotExpiryDate && line.receivedDate) {
        const shelfLifeDays = differenceInCalendarDays(parseISO(line.lotExpiryDate), parseISO(line.receivedDate));
        if (shelfLifeDays < MIN_SHELF_LIFE_DAYS) {
          onLine(
            SupplierInvoiceHoldCodeValues.SHORT_EXPIRY,
            `Lot ${line.lotNumber} had ${pluralize('day', shelfLifeDays, true)} of shelf life left on receipt; ${MIN_SHELF_LIFE_DAYS} are expected.`,
            false,
          );
        }
      }
    }
    return holds;
  }

  // Plans the writes that bring an invoice's holds to the computed causes: a new cause opens a hold, a resolved one
  // reopens, a released one stays released unless its detail changed, and a cause that is gone resolves its hold
  plan(supplierInvoiceId: string, existing: SupplierInvoiceHold[], computed: ComputedHold[]): HoldChanges {
    const keyOf = (hold: { supplierInvoiceLineId: string | null; code: SupplierInvoiceHoldCode }) =>
      `${hold.supplierInvoiceLineId ?? ''}:${hold.code}`;
    const existingByKey = new Map(existing.map((hold) => [keyOf(hold), hold]));
    const computedKeys = new Set(computed.map(keyOf));
    const reopened = {
      status: SupplierInvoiceHoldStatusValues.OPEN,
      releasedBy: null,
      releasedAt: null,
      releaseReason: null,
    };
    const changes: HoldChanges = { inserts: [], updates: [] };

    for (const hold of computed) {
      const current = existingByKey.get(keyOf(hold));
      if (!current) {
        changes.inserts.push({ ...hold, supplierInvoiceId, status: SupplierInvoiceHoldStatusValues.OPEN });
        continue;
      }
      const isSameCause = current.detail === hold.detail && current.blocksPayment === hold.blocksPayment;
      if (current.status === SupplierInvoiceHoldStatusValues.RESOLVED) {
        changes.updates.push({
          id: current.id,
          changes: { ...reopened, detail: hold.detail, blocksPayment: hold.blocksPayment },
        });
      } else if (current.status === SupplierInvoiceHoldStatusValues.RELEASED) {
        if (!isSameCause) {
          changes.updates.push({
            id: current.id,
            changes: { ...reopened, detail: hold.detail, blocksPayment: hold.blocksPayment },
          });
        }
      } else if (!isSameCause) {
        changes.updates.push({ id: current.id, changes: { detail: hold.detail, blocksPayment: hold.blocksPayment } });
      }
    }

    for (const hold of existing) {
      if (computedKeys.has(keyOf(hold)) || hold.status === SupplierInvoiceHoldStatusValues.RESOLVED) continue;
      changes.updates.push({ id: hold.id, changes: { status: SupplierInvoiceHoldStatusValues.RESOLVED } });
    }
    return changes;
  }

  // Releases an open hold with a reason, recording who released it and when, and recounts the invoice's open holds
  async release(
    invoice: Pick<SupplierInvoice, 'id' | 'invoiceNumber'>,
    dto: ReleaseSupplierInvoiceHoldDto,
    releasedBy: string,
  ): Promise<SuccessResponseDto> {
    const hold = await this.findOnInvoiceOrThrow(invoice.id, dto.id);
    if (hold.status !== SupplierInvoiceHoldStatusValues.OPEN) {
      throw new BadRequestException({
        label: 'Hold Not Open',
        detail: `This hold is already ${hold.status.toLowerCase()}.`,
      });
    }
    await this.invoicesRepository.transaction(async () => {
      await this.repository.update(hold.id, {
        status: SupplierInvoiceHoldStatusValues.RELEASED,
        releasedBy,
        releasedAt: new Date(),
        releaseReason: dto.reason,
      });
      await this.invoicesRepository.setOpenHoldCount(invoice.id, await this.repository.countOpenBlocking(invoice.id));
    });
    this.logger.log(`Released hold ${hold.code} (${hold.id}) on supplier invoice ${invoice.invoiceNumber}`);
    return { success: true, message: `Hold released on invoice "${invoice.invoiceNumber}".` };
  }

  // Returns the open holds a purchase order's live invoices carry on lines invoicing it
  async findOpenForPurchaseOrder(purchaseOrderId: string): Promise<PurchaseOrderInvoiceHoldDto[]> {
    return (await this.repository.findOpenForPurchaseOrder(purchaseOrderId)).map(PurchaseOrderInvoiceHoldDto.from);
  }

  // Loads the invoice's rate and currency with its enrollment's tolerances, throwing when the invoice is out of reach
  private async findInvoiceFactsOrThrow(supplierInvoiceId: string): Promise<HoldInvoiceFacts> {
    const invoice = await this.repository.findInvoiceFacts(supplierInvoiceId);
    if (!invoice) throw new NotFoundException('Supplier invoice not found.');
    return invoice;
  }

  // Loads a hold of the given invoice, throwing when it is not on it
  private async findOnInvoiceOrThrow(supplierInvoiceId: string, id: string): Promise<SupplierInvoiceHold> {
    const hold = await this.repository.findOnInvoice(supplierInvoiceId, id);
    if (!hold) throw new NotFoundException('Invoice hold not found.');
    return hold;
  }
}
