import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import Decimal from '@vritti/api-sdk/decimal';
import { and, asc } from '@vritti/api-sdk/drizzle-orm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ValidationException,
} from '@vritti/api-sdk/exceptions';
import { type CurrencyAmountDto, type CurrencyCode, convertMinor, majorToMinor } from '@vritti/api-sdk/money';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type SelectOptionsQueryDto, type SelectQueryResult, selectPageOptions } from '@vritti/api-sdk/select';
import { isBefore, parseISO } from 'date-fns';
import {
  computeFreeQty,
  inventoryItems,
  type PurchaseOrder,
  type PurchaseOrderItem,
  type PurchaseOrderStatus,
  PurchaseOrderStatusValues,
  purchaseOrderItems,
} from '@/db/schema';
import { PurchaseOrderItemDto } from '../dto/entity/purchase-order-item.dto';
import type { AddPurchaseOrderItemDto } from '../dto/request/add-purchase-order-item.dto';
import type { UpdatePurchaseOrderItemDto } from '../dto/request/update-purchase-order-item.dto';
import {
  type PurchaseOrderItemRow,
  PurchaseOrderItemsDomainRepository,
} from '../repositories/purchase-order-items.repository';

export type LinedPurchaseOrder = Pick<PurchaseOrder, 'poNumber' | 'status'> & { hasPostedGoodsReceipt: boolean };

export type PricedPurchaseOrder = Pick<PurchaseOrder, 'currencyCode' | 'conversionRates'>;

export type LineTaxDateChange = { taxDate?: string; followPoTaxDate?: boolean };

export type PurchaseOrderLinesContext = LinedPurchaseOrder &
  PricedPurchaseOrder &
  Pick<PurchaseOrder, 'id' | 'orderDate' | 'taxDate'>;

export interface FreeGoodsScheme {
  buyQty: number | null;
  freeQty: number | null;
  hasScheme: boolean;
}

export interface NewPurchaseOrderLine {
  inventoryItemId: string;
  uomId: string;
  expectedDeliveryDate: string;
  primaryUomQty: number;
  scheme: FreeGoodsScheme;
  supplierCurrencies: string[];
}

export interface OrderedPurchaseOrderLine {
  inventoryItemId: string;
  uomId: string;
  uomQty: number;
  primaryUomQty: number;
  unitPrice: bigint | CurrencyAmountDto;
  scheme: FreeGoodsScheme;
  expectedDeliveryDate: string;
}

export interface ChangedPurchaseOrderLine {
  primaryUomQty: number;
  scheme: FreeGoodsScheme;
  supplierCurrencies: string[];
}

export interface PurchaseOrderItemReceiptMove {
  purchaseOrderItemId: string;
  acceptedPrimaryQty: number;
  rejectedPrimaryQty: number;
}

export interface PurchaseOrderItemInvoicingMove {
  purchaseOrderItemId: string;
  invoicedPrimaryQty: number;
}

export type CounterDirection = 'apply' | 'reverse';

@Injectable()
export class PurchaseOrderItemsDomainService {
  private readonly logger = new Logger(PurchaseOrderItemsDomainService.name);

  private static readonly EDITABLE_STATUSES: PurchaseOrderStatus[] = [
    PurchaseOrderStatusValues.DRAFT,
    PurchaseOrderStatusValues.SENT,
    PurchaseOrderStatusValues.CONFIRMED,
  ];

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    inventoryItemName: { column: inventoryItems.name, type: 'string' },
  };
  private static readonly FIELD_MAP: FieldMap = {
    ...PurchaseOrderItemsDomainService.SEARCH_FIELD_MAP,
    inventoryItemId: { column: purchaseOrderItems.inventoryItemId, type: 'string' },
    expectedDeliveryDate: { column: purchaseOrderItems.expectedDeliveryDate, type: 'string' },
    taxDate: { column: purchaseOrderItems.taxDate, type: 'string' },
    uomQty: { column: purchaseOrderItems.uomQty, type: 'number' },
    receivedPrimaryQty: { column: purchaseOrderItems.receivedPrimaryQty, type: 'number' },
    invoicedPrimaryQty: { column: purchaseOrderItems.invoicedPrimaryQty, type: 'number' },
    unitPrice: { column: purchaseOrderItems.unitPrice, type: 'number' },
    totalPrice: { column: purchaseOrderItems.totalPrice, type: 'number' },
  };

  constructor(private readonly repository: PurchaseOrderItemsDomainRepository) {}

  // Adds a line priced in the PO currency, converting another quoted currency at the PO's rate for it
  async addItem(
    po: PurchaseOrderLinesContext,
    dto: AddPurchaseOrderItemDto,
    line: NewPurchaseOrderLine,
  ): Promise<void> {
    this.assertLinesEditable(po);
    this.assertDeliveryNotBeforeOrder(po, line.expectedDeliveryDate);
    await this.assertNotOnPurchaseOrder(po.id, line, 'supplierItemId');

    const quotedCurrency = dto.unitPrice.currency;
    const quotedPrice = majorToMinor(dto.unitPrice.value, quotedCurrency as CurrencyCode, 'unitPrice');
    const isQuotedInPoCurrency = quotedCurrency === po.currencyCode;
    const unitPrice = isQuotedInPoCurrency
      ? quotedPrice
      : convertMinor(
          quotedPrice,
          quotedCurrency,
          po.currencyCode,
          this.conversionRateOrThrow(po, quotedCurrency, line.supplierCurrencies),
        );

    await this.repository.create({
      purchaseOrderId: po.id,
      inventoryItemId: line.inventoryItemId,
      expectedDeliveryDate: line.expectedDeliveryDate,
      taxDate: po.taxDate,
      isTaxDateOverridden: false,
      uomId: line.uomId,
      uomQty: dto.uomQty,
      primaryUomQty: line.primaryUomQty,
      ...this.lineAmounts(unitPrice, dto.uomQty, line.primaryUomQty),
      currencyCode: po.currencyCode,
      sourceCurrencyCode: isQuotedInPoCurrency ? null : quotedCurrency,
      sourceUnitPrice: isQuotedInPoCurrency ? null : quotedPrice,
      ...this.schemeColumns(line.scheme, dto.uomQty, line.primaryUomQty),
    });
    this.logger.log(`Added item ${line.inventoryItemId} to PO ${po.poNumber}`);
  }

  // Adds a purchase's lines to its new PO, each priced in the PO currency from the allocation it comes from (in minor
  // units) or from the invoice that receives it, and returns them in the given order
  async addOrderedLines(
    po: PurchaseOrderLinesContext,
    lines: OrderedPurchaseOrderLine[],
  ): Promise<PurchaseOrderItem[]> {
    this.assertLinesEditable(po);
    for (const line of lines) this.assertDeliveryNotBeforeOrder(po, line.expectedDeliveryDate);
    const created: PurchaseOrderItem[] = [];
    for (const line of lines) {
      created.push(
        await this.repository.create({
          purchaseOrderId: po.id,
          inventoryItemId: line.inventoryItemId,
          expectedDeliveryDate: line.expectedDeliveryDate,
          taxDate: po.taxDate,
          isTaxDateOverridden: false,
          uomId: line.uomId,
          uomQty: line.uomQty,
          primaryUomQty: line.primaryUomQty,
          ...this.lineAmounts(this.orderedUnitPrice(po, line.unitPrice), line.uomQty, line.primaryUomQty),
          currencyCode: po.currencyCode,
          sourceCurrencyCode: null,
          sourceUnitPrice: null,
          ...this.schemeColumns(line.scheme, line.uomQty, line.primaryUomQty),
        }),
      );
    }
    this.logger.log(`Added ${created.length} ordered lines to PO ${po.poNumber}`);
    return created;
  }

  // Updates a line's item, quantity, price, scheme, expected delivery or tax date, pricing it again in the PO currency
  async updateItem(
    po: PurchaseOrderLinesContext,
    dto: UpdatePurchaseOrderItemDto,
    line: ChangedPurchaseOrderLine,
  ): Promise<SuccessResponseDto> {
    this.assertLinesEditable(po);
    this.assertSingleTaxDateChange(dto);
    const item = await this.findDetailOnPurchaseOrderOrThrow(po.id, dto.itemId);
    if (dto.expectedDeliveryDate !== undefined) {
      this.assertDeliveryNotBeforeOrder(po, dto.expectedDeliveryDate);
    }
    const isTaxDateChanged = dto.taxDate !== undefined || dto.followPoTaxDate === true;
    if (isTaxDateChanged) this.assertTaxDateUnlocked(item);
    const inventoryItemId = dto.inventoryItemId ?? item.inventoryItemId;
    if (inventoryItemId !== item.inventoryItemId) {
      await this.assertNotOnGoodsReceipt(item.id, 'Cannot Change Item');
      await this.assertNotOnPurchaseOrder(po.id, { inventoryItemId, uomId: item.uomId }, 'inventoryItemId', item.id);
    }

    const uomQty = dto.uomQty ?? item.uomQty;
    const quotedCurrency = dto.unitPrice?.currency ?? item.sourceCurrencyCode ?? po.currencyCode;
    const quotedPrice = dto.unitPrice
      ? majorToMinor(dto.unitPrice.value, quotedCurrency as CurrencyCode, 'unitPrice')
      : (item.sourceUnitPrice ?? item.unitPrice);
    const isQuotedInPoCurrency = quotedCurrency === po.currencyCode;
    const unitPrice = isQuotedInPoCurrency
      ? quotedPrice
      : convertMinor(
          quotedPrice,
          quotedCurrency,
          po.currencyCode,
          this.conversionRateOrThrow(po, quotedCurrency, line.supplierCurrencies),
        );
    const totalPrice = new Decimal(unitPrice.toString()).times(uomQty).toDecimalPlaces(0);

    await this.repository.update(item.id, {
      inventoryItemId,
      expectedDeliveryDate: dto.expectedDeliveryDate ?? item.expectedDeliveryDate,
      taxDate: dto.followPoTaxDate ? po.taxDate : (dto.taxDate ?? item.taxDate),
      isTaxDateOverridden: isTaxDateChanged ? !dto.followPoTaxDate : item.isTaxDateOverridden,
      uomQty,
      primaryUomQty: line.primaryUomQty,
      unitPrice,
      totalPrice: BigInt(totalPrice.toFixed(0)),
      primaryUomUnitPrice: BigInt(totalPrice.dividedBy(line.primaryUomQty).toFixed(0)),
      sourceCurrencyCode: isQuotedInPoCurrency ? null : quotedCurrency,
      sourceUnitPrice: isQuotedInPoCurrency ? null : quotedPrice,
      schemeBuyQty: line.scheme.buyQty,
      schemeFreeQty: line.scheme.freeQty,
      hasScheme: line.scheme.hasScheme,
      freePrimaryQty: new Decimal(
        computeFreeQty(uomQty, line.scheme.buyQty, line.scheme.freeQty, line.scheme.hasScheme),
      )
        .times(line.primaryUomQty)
        .dividedBy(uomQty)
        .toDecimalPlaces(3, Decimal.ROUND_HALF_UP)
        .toNumber(),
    });
    this.logger.log(`Updated item ${item.id} on PO ${po.poNumber}`);
    return { success: true, message: `Line item updated for purchase order "${po.poNumber}".` };
  }

  // Moves every line that follows the PO's tax date to its new one, unless a receipt or an invoice locks one of them
  async followPoTaxDate(purchaseOrderId: string, taxDate: string): Promise<number> {
    await this.assertFollowersUnlocked(purchaseOrderId);
    return this.repository.setFollowersTaxDate(purchaseOrderId, taxDate);
  }

  // Converts every line quoted in `currencyCode` again at its new rate; the caller stores the rate and syncs the total
  async repriceSourceCurrency(po: PurchaseOrderLinesContext, currencyCode: string, rate: string): Promise<number> {
    this.assertLinesEditable(po);
    const lines = await this.repository.findByPurchaseOrderId(po.id);
    const quotedInCurrency = lines.filter(
      (line): line is PurchaseOrderItemRow & { sourceUnitPrice: bigint } =>
        line.sourceCurrencyCode === currencyCode && line.sourceUnitPrice !== null,
    );

    for (const line of quotedInCurrency) {
      const unitPrice = convertMinor(line.sourceUnitPrice, currencyCode, po.currencyCode, rate);
      const totalPrice = new Decimal(unitPrice.toString()).times(line.uomQty).toDecimalPlaces(0);
      await this.repository.update(line.id, {
        unitPrice,
        totalPrice: BigInt(totalPrice.toFixed(0)),
        primaryUomUnitPrice: BigInt(totalPrice.dividedBy(line.primaryUomQty).toFixed(0)),
      });
    }
    return quotedInCurrency.length;
  }

  // Moves the received and rejected counters of the lines a posted receipt counted, in the caller's transaction
  async applyReceipt(moves: PurchaseOrderItemReceiptMove[], direction: CounterDirection): Promise<void> {
    const sign = direction === 'apply' ? 1 : -1;
    for (const move of moves) {
      await this.repository.addToCounters(move.purchaseOrderItemId, {
        receivedPrimaryQty: new Decimal(move.acceptedPrimaryQty).times(sign).toNumber(),
        rejectedPrimaryQty: new Decimal(move.rejectedPrimaryQty).times(sign).toNumber(),
      });
    }
  }

  // Moves the invoiced counter (invoiced plus free) of the lines a posted invoice invoices, in the caller's transaction
  async applyInvoicing(moves: PurchaseOrderItemInvoicingMove[], direction: CounterDirection): Promise<void> {
    const sign = direction === 'apply' ? 1 : -1;
    for (const move of moves) {
      await this.repository.addToCounters(move.purchaseOrderItemId, {
        invoicedPrimaryQty: new Decimal(move.invoicedPrimaryQty).times(sign).toNumber(),
      });
    }
  }

  // Cancels what each line of a PO marked delivery completed still had to receive, in the caller's transaction
  async cancelRemaining(purchaseOrderId: string): Promise<number> {
    const lines = await this.repository.findByPurchaseOrderId(purchaseOrderId);
    let cancelledLines = 0;
    for (const line of lines) {
      const remaining = new Decimal(line.primaryUomQty)
        .plus(line.freePrimaryQty)
        .minus(line.cancelledPrimaryQty)
        .minus(line.receivedPrimaryQty);
      if (remaining.lte(0)) continue;
      await this.repository.addToCounters(line.id, { cancelledPrimaryQty: remaining.toNumber() });
      cancelledLines += 1;
    }
    return cancelledLines;
  }

  // Returns one page of a PO's lines
  async findForTable(
    purchaseOrderId: string,
    state: TableState,
  ): Promise<{ result: PurchaseOrderItemDto[]; count: number }> {
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PurchaseOrderItemsDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForTable(purchaseOrderId, {
      where: and(
        FilterProcessor.buildWhere(state.filters, PurchaseOrderItemsDomainService.FIELD_MAP),
        FilterProcessor.buildSearch(state.search, PurchaseOrderItemsDomainService.SEARCH_FIELD_MAP),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [asc(inventoryItems.name)],
      limit,
      offset,
    });
    return { result: result.map(PurchaseOrderItemDto.from), count };
  }

  // Returns the lines of one PO as select options
  findForSelectByPurchaseOrder(purchaseOrderId: string, query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelectByPurchaseOrder(purchaseOrderId, {
      ...selectPageOptions(query),
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey || 'categoryId',
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
    });
  }

  // Returns every line of a PO
  async findByPurchaseOrderId(purchaseOrderId: string): Promise<PurchaseOrderItemDto[]> {
    const rows = await this.repository.findByPurchaseOrderId(purchaseOrderId);
    return rows.map(PurchaseOrderItemDto.from);
  }

  // Returns the inventory items ordered on a PO
  findInventoryItemIds(purchaseOrderId: string): Promise<string[]> {
    return this.repository.findInventoryItemIds(purchaseOrderId);
  }

  // Returns every line of the given POs with its item, units and counters
  findRowsByPurchaseOrderIds(purchaseOrderIds: string[]): Promise<PurchaseOrderItemRow[]> {
    return this.repository.findByPurchaseOrderIds(purchaseOrderIds);
  }

  // Loads a line of the given PO, throwing when it is not on it
  async findOnPurchaseOrderOrThrow(purchaseOrderId: string, itemId: string): Promise<PurchaseOrderItem> {
    const item = await this.repository.findOnPurchaseOrder(purchaseOrderId, itemId);
    if (!item) throw new NotFoundException('Purchase order line item not found.');
    return item;
  }

  // Removes a line that no goods receipt counts goods against
  async removeItem(po: PurchaseOrderLinesContext, itemId: string): Promise<SuccessResponseDto> {
    this.assertLinesEditable(po);
    const item = await this.findOnPurchaseOrderOrThrow(po.id, itemId);
    await this.assertNotOnGoodsReceipt(item.id, 'Cannot Remove Item');

    await this.repository.delete(item.id);
    this.logger.log(`Removed item ${item.id} from PO ${po.poNumber}`);
    return { success: true, message: `Line item removed from purchase order "${po.poNumber}".` };
  }

  // Returns an ordered line's unit price in minor units of the PO currency, rejecting a price quoted in another one
  private orderedUnitPrice(po: PricedPurchaseOrder, unitPrice: bigint | CurrencyAmountDto): bigint {
    if (typeof unitPrice === 'bigint') return unitPrice;
    if (unitPrice.currency !== po.currencyCode) {
      throw new ValidationException({
        label: 'Wrong Currency',
        detail: `The order is in ${po.currencyCode}; price its lines in ${po.currencyCode}.`,
        errors: [{ field: 'unitPrice', message: `Must be in ${po.currencyCode}` }],
      });
    }
    return majorToMinor(unitPrice.value, unitPrice.currency, 'unitPrice');
  }

  // Prices a line in the PO currency: its total and its price per primary unit
  private lineAmounts(
    unitPrice: bigint,
    uomQty: number,
    primaryUomQty: number,
  ): Pick<PurchaseOrderItem, 'unitPrice' | 'totalPrice' | 'primaryUomUnitPrice'> {
    const totalPrice = new Decimal(unitPrice.toString()).times(uomQty).toDecimalPlaces(0);
    return {
      unitPrice,
      totalPrice: BigInt(totalPrice.toFixed(0)),
      primaryUomUnitPrice: BigInt(totalPrice.dividedBy(primaryUomQty).toFixed(0)),
    };
  }

  // Returns a line's scheme columns with the free primary quantity the scheme earns on its units
  private schemeColumns(
    scheme: FreeGoodsScheme,
    uomQty: number,
    primaryUomQty: number,
  ): Pick<PurchaseOrderItem, 'schemeBuyQty' | 'schemeFreeQty' | 'hasScheme' | 'freePrimaryQty'> {
    return {
      schemeBuyQty: scheme.buyQty,
      schemeFreeQty: scheme.freeQty,
      hasScheme: scheme.hasScheme,
      freePrimaryQty: new Decimal(computeFreeQty(uomQty, scheme.buyQty, scheme.freeQty, scheme.hasScheme))
        .times(primaryUomQty)
        .dividedBy(uomQty)
        .toDecimalPlaces(3, Decimal.ROUND_HALF_UP)
        .toNumber(),
    };
  }

  // Loads a line of the given PO with its delivery numbers and tax date lock, throwing when it is not on it
  private async findDetailOnPurchaseOrderOrThrow(
    purchaseOrderId: string,
    itemId: string,
  ): Promise<PurchaseOrderItemRow> {
    const item = await this.repository.findDetailOnPurchaseOrder(purchaseOrderId, itemId);
    if (!item) throw new NotFoundException('Purchase order line item not found.');
    return item;
  }

  // Rejects a line change once the PO is past confirmation or one of its receipts is posted
  private assertLinesEditable(po: LinedPurchaseOrder): void {
    const isEditableStatus = PurchaseOrderItemsDomainService.EDITABLE_STATUSES.includes(po.status);
    if (isEditableStatus && !po.hasPostedGoodsReceipt) return;
    throw new BadRequestException({
      label: 'Cannot Edit Line Items',
      detail: `"${po.poNumber}" is ${po.status} or has a posted goods receipt, so its line items are locked.`,
    });
  }

  // Rejects a line expected before the PO's order date
  private assertDeliveryNotBeforeOrder(po: Pick<PurchaseOrder, 'orderDate'>, expectedDeliveryDate: string): void {
    if (!isBefore(parseISO(expectedDeliveryDate), parseISO(po.orderDate))) return;
    throw new BadRequestException({
      label: 'Delivery Before Order Date',
      detail: `The order is dated ${po.orderDate}, so this line cannot be expected on ${expectedDeliveryDate}.`,
      errors: [{ field: 'expectedDeliveryDate', message: 'Before the order date' }],
    });
  }

  // Rejects a tax date change that both sets a date and asks the line to follow the PO
  private assertSingleTaxDateChange(change: LineTaxDateChange): void {
    if (change.taxDate === undefined || !change.followPoTaxDate) return;
    throw new BadRequestException({
      label: 'Conflicting Tax Date',
      detail: 'Either set a tax date for this line or let it follow the purchase order, not both.',
      errors: [{ field: 'taxDate', message: 'Conflicts with following the PO' }],
    });
  }

  // Rejects a tax date change on a line a posted goods receipt or a posted supplier invoice counts
  private assertTaxDateUnlocked(item: Pick<PurchaseOrderItemRow, 'isTaxDateLocked'>): void {
    if (!item.isTaxDateLocked) return;
    throw new BadRequestException({
      label: 'Tax Date Locked',
      detail: 'A posted goods receipt or a posted supplier invoice counts this line, so its tax date is locked.',
      errors: [{ field: 'taxDate', message: 'Locked' }],
    });
  }

  // Rejects moving a PO's tax date while a line that follows it is locked by a receipt or an invoice
  private async assertFollowersUnlocked(purchaseOrderId: string): Promise<void> {
    const hasLockedFollower = await this.repository.hasLockedFollower(purchaseOrderId);
    if (!hasLockedFollower) return;
    throw new BadRequestException({
      label: 'Cannot Change Tax Date',
      detail:
        'A line that follows the tax date is counted by a posted goods receipt or a posted supplier invoice, so the tax date is locked.',
      errors: [{ field: 'taxDate', message: 'Locked' }],
    });
  }

  // Rejects ordering an item in a unit another line of the PO already orders it in
  private async assertNotOnPurchaseOrder(
    purchaseOrderId: string,
    line: { inventoryItemId: string; uomId: string },
    field: 'supplierItemId' | 'inventoryItemId',
    excludeItemId?: string,
  ): Promise<void> {
    const isOrdered = await this.repository.isOrderedInUnit(purchaseOrderId, line, excludeItemId);
    if (!isOrdered) return;
    throw new ConflictException({
      label: 'Already Ordered',
      detail: 'This item is already on the purchase order in the same unit. Edit that line instead.',
      errors: [{ field, message: 'Already on this order' }],
    });
  }

  // Rejects removing a line, or changing its item, once a goods receipt (draft or posted) counts goods against it
  private async assertNotOnGoodsReceipt(itemId: string, label: string): Promise<void> {
    const isOnGoodsReceipt = await this.repository.isOnGoodsReceipt(itemId);
    if (!isOnGoodsReceipt) return;
    throw new BadRequestException({
      label,
      detail: 'A goods receipt counts goods against this line. Remove it from the receipt first.',
    });
  }

  // Returns the PO's stored rate into its currency for a price quoted in another of the supplier's currencies
  private conversionRateOrThrow(po: PricedPurchaseOrder, currencyCode: string, supplierCurrencies: string[]): string {
    if (!supplierCurrencies.includes(currencyCode)) {
      throw new ValidationException({
        label: 'Currency Not Accepted',
        detail: `The unit price must be in one of the supplier's currencies (${supplierCurrencies.join(', ')}).`,
        errors: [{ field: 'unitPrice', message: "Not one of the supplier's currencies" }],
      });
    }
    const rate = po.conversionRates[currencyCode];
    if (rate) return rate;
    throw new ValidationException({
      label: 'Conversion Rate Required',
      detail: `Enter how much 1 ${currencyCode} is in ${po.currencyCode} to price this line.`,
      errors: [{ field: 'conversionRate', message: `1 ${currencyCode} in ${po.currencyCode}` }],
    });
  }
}
