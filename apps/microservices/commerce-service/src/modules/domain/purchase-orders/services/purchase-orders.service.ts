import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import Decimal from '@vritti/api-sdk/decimal';
import { and, desc, inArray } from '@vritti/api-sdk/drizzle-orm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ValidationException,
} from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type SelectOptionsQueryDto, type SelectQueryResult, selectPageOptions } from '@vritti/api-sdk/select';
import {
  type PurchaseOrder,
  type PurchaseOrderInvoiceStatus,
  PurchaseOrderInvoiceStatusValues,
  type PurchaseOrderReceiptStatus,
  PurchaseOrderReceiptStatusValues,
  type PurchaseOrderStatus,
  PurchaseOrderStatusValues,
  parties,
  purchaseOrders,
} from '@/db/schema';
import { PurchaseOrderDto } from '../dto/entity/purchase-order.dto';
import { PurchaseOrderCountsDto } from '../dto/entity/purchase-order-counts.dto';
import type { CreatePurchaseOrderDto } from '../dto/request/create-purchase-order.dto';
import type { UpdatePurchaseOrderNotesDto } from '../dto/request/update-purchase-order-notes.dto';
import {
  type PurchaseOrderLineCounters,
  type PurchaseOrderRow,
  PurchaseOrdersDomainRepository,
} from '../repositories/purchase-orders.repository';

export interface PurchaseOrderCreateContext {
  siteId?: string;
  currencyCode: string;
  leCurrencyCode: string;
  paymentTermId: string;
}

export interface PurchaseOrderSupplier {
  id: string;
  name: string;
  currencyCode: string;
  currencyCodes: string[];
  paymentTermId: string;
}

export interface PurchaseOrderForPurchase {
  purchaseId: string;
  siteId: string;
  supplierId: string;
  paymentTermId: string;
  currencyCode: string;
  exchangeRate: number;
  orderDate: string;
  status: typeof PurchaseOrderStatusValues.SENT | typeof PurchaseOrderStatusValues.CONFIRMED;
}

export interface PurchaseOrderStatuses {
  receiptStatus: PurchaseOrderReceiptStatus;
  invoiceStatus: PurchaseOrderInvoiceStatus;
}

@Injectable()
export class PurchaseOrdersDomainService {
  private readonly logger = new Logger(PurchaseOrdersDomainService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    poNumber: { column: purchaseOrders.poNumber, type: 'string' },
    supplierName: { column: parties.displayName, type: 'string' },
  };
  private static readonly FILTER_FIELD_MAP: FieldMap = {
    status: { column: purchaseOrders.status, type: 'string' },
    receiptStatus: { column: purchaseOrders.receiptStatus, type: 'string' },
    invoiceStatus: { column: purchaseOrders.invoiceStatus, type: 'string' },
    supplierId: { column: purchaseOrders.supplierId, type: 'string' },
    siteId: { column: purchaseOrders.siteId, type: 'string' },
    sites: { column: purchaseOrders.siteId, type: 'string' },
  };
  private static readonly SORT_FIELD_MAP: FieldMap = {
    ...PurchaseOrdersDomainService.SEARCH_FIELD_MAP,
    ...PurchaseOrdersDomainService.FILTER_FIELD_MAP,
    orderDate: { column: purchaseOrders.orderDate, type: 'string' },
    taxDate: { column: purchaseOrders.taxDate, type: 'string' },
  };

  private static readonly TAX_DATE_EDITABLE_STATUSES: PurchaseOrderStatus[] = [
    PurchaseOrderStatusValues.DRAFT,
    PurchaseOrderStatusValues.SENT,
    PurchaseOrderStatusValues.CONFIRMED,
  ];

  private static readonly STATUS_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
    [PurchaseOrderStatusValues.DRAFT]: [PurchaseOrderStatusValues.SENT, PurchaseOrderStatusValues.CANCELLED],
    [PurchaseOrderStatusValues.SENT]: [PurchaseOrderStatusValues.CONFIRMED, PurchaseOrderStatusValues.CANCELLED],
    [PurchaseOrderStatusValues.CONFIRMED]: [PurchaseOrderStatusValues.CANCELLED],
    [PurchaseOrderStatusValues.DELIVERY_COMPLETED]: [],
    [PurchaseOrderStatusValues.CANCELLED]: [],
    [PurchaseOrderStatusValues.PENDING_APPROVAL]: [],
    [PurchaseOrderStatusValues.APPROVED]: [],
    [PurchaseOrderStatusValues.REJECTED]: [],
  };

  constructor(private readonly repository: PurchaseOrdersDomainRepository) {}

  // Creates a draft PO at the given site, else the request's, storing an exchange rate only when its currency is not the
  // legal entity's
  async create(
    dto: CreatePurchaseOrderDto,
    context: PurchaseOrderCreateContext,
  ): Promise<CreateResponseDto<PurchaseOrderDto>> {
    const exchangeRate = this.resolveExchangeRateOrThrow(
      context.currencyCode,
      context.leCurrencyCode,
      dto.exchangeRate,
    );
    const poNumber = await this.repository.generatePoNumber();
    const created = await this.repository.create({
      siteId: context.siteId,
      supplierId: dto.supplierId,
      poNumber,
      paymentTermId: context.paymentTermId,
      currencyCode: context.currencyCode,
      exchangeRate,
      orderDate: dto.orderDate,
      taxDate: dto.taxDate,
      notes: dto.notes,
    });

    this.logger.log(`Created PO ${poNumber} at site ${created.siteId}`);
    return {
      success: true,
      message: `Purchase order "${poNumber}" created successfully.`,
      data: await this.findById(created.id),
    };
  }

  // Creates a purchase's PO, sent or confirmed, without lines yet, in the caller's transaction; the rate is resolved first
  async createForPurchase(order: PurchaseOrderForPurchase): Promise<PurchaseOrder> {
    const poNumber = await this.repository.generatePoNumber();
    const created = await this.repository.create({
      ...order,
      poNumber,
      taxDate: order.orderDate,
      notes: null,
    });
    this.logger.log(`Created PO ${poNumber} (${order.status}) for purchase ${order.purchaseId}`);
    return created;
  }

  // Updates the notes on a purchase order
  async updateNotes(dto: UpdatePurchaseOrderNotesDto): Promise<SuccessResponseDto> {
    const po = await this.findDetailOrThrow(dto.id);
    await this.repository.update(po.id, { notes: dto.notes ?? null });
    this.logger.log(`Updated PO ${po.poNumber} notes`);
    return { success: true, message: `Notes updated for purchase order "${po.poNumber}".` };
  }

  // Sets the tax date of a PO whose lines are still editable; the caller moves the lines that follow it
  async updateTaxDate(po: PurchaseOrderRow, taxDate: string): Promise<void> {
    this.assertTaxDateEditable(po);
    await this.repository.update(po.id, { taxDate });
    this.logger.log(`Updated PO ${po.poNumber} tax date to ${taxDate}`);
  }

  // Moves a draft PO to another supplier, switching to its default currency when it does not trade in the PO's
  async changeSupplier(
    po: PurchaseOrderRow,
    supplier: PurchaseOrderSupplier,
    leCurrencyCode: string,
    exchangeRate: number | undefined,
  ): Promise<SuccessResponseDto> {
    this.assertSupplierChangeable(po);

    const keepsCurrency = supplier.currencyCodes.includes(po.currencyCode);
    const currencyCode = keepsCurrency ? po.currencyCode : supplier.currencyCode;
    await this.repository.update(po.id, {
      supplierId: supplier.id,
      paymentTermId: supplier.paymentTermId,
      conversionRates: {},
      currencyCode,
      exchangeRate: keepsCurrency
        ? po.exchangeRate
        : this.resolveExchangeRateOrThrow(currencyCode, leCurrencyCode, exchangeRate),
    });

    this.logger.log(`Changed PO ${po.poNumber} supplier to ${supplier.id}`);
    return { success: true, message: `Supplier changed to "${supplier.name}" for purchase order "${po.poNumber}".` };
  }

  // Changes the rate into the legal entity's currency of a foreign-currency PO until a receipt of it is posted
  async changeExchangeRate(
    po: PurchaseOrderRow,
    exchangeRate: number,
    leCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    this.assertPricingUnlocked(po, 'Cannot Change Exchange Rate');
    if (po.currencyCode === leCurrencyCode) {
      throw new BadRequestException({
        label: 'Cannot Change Exchange Rate',
        detail: `"${po.poNumber}" is in ${leCurrencyCode}, the legal entity's currency, so its rate is always 1.`,
      });
    }

    await this.repository.update(po.id, { exchangeRate });
    this.logger.log(`Changed PO ${po.poNumber} exchange rate to ${exchangeRate}`);
    return { success: true, message: `Exchange rate updated for purchase order "${po.poNumber}".` };
  }

  // Records 1 unit of another supplier currency in the PO currency; the caller converts its lines and syncs the total
  async setConversionRate(po: PurchaseOrderRow, currencyCode: string, rate: number): Promise<string> {
    this.assertPricingUnlocked(po, 'Cannot Change Conversion Rate');
    if (currencyCode === po.currencyCode) {
      throw new BadRequestException({
        label: 'Same Currency',
        detail: `The purchase order is already in ${currencyCode}.`,
        errors: [{ field: 'currencyCode', message: 'Same as the PO currency' }],
      });
    }
    const stored = new Decimal(rate).toFixed(6);
    await this.repository.update(po.id, { conversionRates: { ...po.conversionRates, [currencyCode]: stored } });
    this.logger.log(`Set PO ${po.poNumber} rate 1 ${currencyCode} = ${stored} ${po.currencyCode}`);
    return stored;
  }

  // Moves a PO along its workflow (send, confirm, cancel), in the caller's transaction; completing delivery goes through completeDelivery
  async changeStatus(po: PurchaseOrderRow, status: PurchaseOrderStatus): Promise<SuccessResponseDto> {
    const allowedNext = PurchaseOrdersDomainService.STATUS_TRANSITIONS[po.status];
    if (!allowedNext.includes(status)) {
      throw new BadRequestException({
        label: 'Cannot Change Status',
        detail: `A ${po.status} purchase order cannot move to ${status}.`,
      });
    }
    if (status === PurchaseOrderStatusValues.CANCELLED) this.assertCancellable(po);
    if (status === PurchaseOrderStatusValues.SENT && po.totalAmount <= 0n) {
      throw new BadRequestException({
        label: 'Cannot Mark as Sent',
        detail: 'Add priced line items before marking the purchase order as sent.',
      });
    }
    await this.repository.update(po.id, { status });
    this.logger.log(`PO ${po.poNumber} status → ${status}`);
    return { success: true, message: `Purchase order "${po.poNumber}" status updated to ${status}.` };
  }

  // Marks a confirmed PO delivery completed, in the caller's transaction; the caller cancels what its lines still had to receive
  async completeDelivery(po: PurchaseOrderRow): Promise<void> {
    this.assertDeliveryCompletable(po);
    await this.repository.update(po.id, { status: PurchaseOrderStatusValues.DELIVERY_COMPLETED });
    this.logger.log(`Marked PO ${po.poNumber} delivery completed`);
  }

  // Recomputes the cached receipt and invoicing statuses of the given POs from their line counters, in the caller's transaction
  async syncProgress(purchaseOrderIds: string[]): Promise<void> {
    const ids = _.uniq(purchaseOrderIds);
    const orders = await this.repository.findProgress(ids);
    const linesByOrder = _.groupBy(await this.repository.findLineCounters(ids), 'purchaseOrderId');
    for (const po of orders) {
      const next = this.deriveStatuses(linesByOrder[po.id] ?? []);
      if (next.receiptStatus === po.receiptStatus && next.invoiceStatus === po.invoiceStatus) continue;
      await this.repository.update(po.id, next);
      this.logger.log(`PO ${po.poNumber} receipt → ${next.receiptStatus}, invoicing → ${next.invoiceStatus}`);
    }
  }

  // Recomputes the cached receipt and invoicing statuses of the POs the given lines belong to, in the caller's transaction
  async syncProgressOfItems(purchaseOrderItemIds: string[]): Promise<void> {
    await this.syncProgress(await this.repository.findIdsByItemIds(purchaseOrderItemIds));
  }

  // Recalculates a PO's total from the sum of its line totals, in the caller's transaction
  async syncTotalAmount(id: string): Promise<void> {
    await this.repository.syncTotalAmount(id);
  }

  // Returns one purchase order header
  async findById(id: string): Promise<PurchaseOrderDto> {
    return PurchaseOrderDto.from(await this.findDetailOrThrow(id));
  }

  // Returns one page of purchase orders
  async findForTable(state: TableState): Promise<{ result: PurchaseOrderDto[]; count: number }> {
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PurchaseOrdersDomainService.SORT_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForTable({
      where: and(
        FilterProcessor.buildWhere(state.filters, PurchaseOrdersDomainService.FILTER_FIELD_MAP),
        FilterProcessor.buildSearch(state.search, PurchaseOrdersDomainService.SEARCH_FIELD_MAP),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [desc(purchaseOrders.createdAt)],
      limit,
      offset,
    });
    return { result: result.map(PurchaseOrderDto.from), count };
  }

  // Counts a purchase order's lines and the deliveries, receipts and invoices on them, one per tab of its detail page
  async findCounts(id: string): Promise<PurchaseOrderCountsDto> {
    return PurchaseOrderCountsDto.from(await this.repository.findCountsOrThrow(id));
  }

  // Returns paginated purchase order options for select dropdowns, optionally narrowed to statuses and a supplier
  findForSelect(query: SelectOptionsQueryDto & { status?: string; supplierId?: string }): Promise<SelectQueryResult> {
    const statuses = (query.status ?? '')
      .split(',')
      .map((status) => status.trim())
      .filter((status): status is PurchaseOrderStatus => status in PurchaseOrderStatusValues);

    return this.repository.findForSelect({
      ...selectPageOptions(query),
      value: query.valueKey || 'id',
      label: query.labelKey || 'poNumber',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      where: query.supplierId ? { supplierId: query.supplierId } : undefined,
      conditions: statuses.length > 0 ? [inArray(purchaseOrders.status, statuses)] : undefined,
      orderByKey: query.orderByKey || 'poNumber',
      orderDirection: query.orderDirection || 'desc',
    });
  }

  // Returns the POs a purchase created, with their suppliers, line counts and receipt state
  findForPurchase(purchaseId: string): Promise<PurchaseOrderRow[]> {
    return this.repository.findForPurchase(purchaseId);
  }

  // Derives a PO's receipt and invoicing statuses from its lines: due = ordered + free − cancelled; a line is received
  // once received ≥ due and invoiced once invoiced ≥ due; open to invoice = received − returned − invoiced
  deriveStatuses(lines: PurchaseOrderLineCounters[]): PurchaseOrderStatuses {
    const due = (line: PurchaseOrderLineCounters) =>
      new Decimal(line.primaryUomQty).plus(line.freePrimaryQty).minus(line.cancelledPrimaryQty);
    const received = lines.reduce((total, line) => total.plus(line.receivedPrimaryQty), new Decimal(0));
    const invoiced = lines.reduce((total, line) => total.plus(line.invoicedPrimaryQty), new Decimal(0));
    const openToInvoice = lines.reduce(
      (total, line) =>
        total.plus(
          Decimal.max(
            0,
            new Decimal(line.receivedPrimaryQty).minus(line.returnedPrimaryQty).minus(line.invoicedPrimaryQty),
          ),
        ),
      new Decimal(0),
    );

    let receiptStatus: PurchaseOrderReceiptStatus = PurchaseOrderReceiptStatusValues.NOT_RECEIVED;
    if (received.gt(0)) {
      receiptStatus = lines.every((line) => new Decimal(line.receivedPrimaryQty).gte(due(line)))
        ? PurchaseOrderReceiptStatusValues.RECEIVED
        : PurchaseOrderReceiptStatusValues.PARTIAL;
    }

    let invoiceStatus: PurchaseOrderInvoiceStatus = openToInvoice.gt(0)
      ? PurchaseOrderInvoiceStatusValues.TO_INVOICE
      : PurchaseOrderInvoiceStatusValues.NOTHING_TO_INVOICE;
    if (invoiced.gt(0)) {
      invoiceStatus = lines.every((line) => new Decimal(line.invoicedPrimaryQty).gte(due(line)))
        ? PurchaseOrderInvoiceStatusValues.INVOICED
        : PurchaseOrderInvoiceStatusValues.PARTIAL;
    }
    return { receiptStatus, invoiceStatus };
  }

  // Loads a PO with its supplier name, line count and receipt state, throwing when it is out of reach
  async findDetailOrThrow(id: string): Promise<PurchaseOrderRow> {
    const po = await this.repository.findDetail(id);
    if (!po) throw new NotFoundException('Purchase order not found.');
    return po;
  }

  // Rejects marking a PO delivery completed unless it is confirmed
  assertDeliveryCompletable(po: Pick<PurchaseOrder, 'poNumber' | 'status'>): void {
    if (po.status === PurchaseOrderStatusValues.CONFIRMED) return;
    throw new BadRequestException({
      label: 'Cannot Mark Delivery Completed',
      detail: `"${po.poNumber}" is ${po.status}; only a confirmed purchase order can be marked delivery completed.`,
    });
  }

  // Returns the rate a PO stores: 1 in the legal entity's own currency, the given one in any other
  resolveExchangeRateOrThrow(currencyCode: string, leCurrencyCode: string, exchangeRate: number | undefined): number {
    if (currencyCode === leCurrencyCode) return 1;
    if (exchangeRate !== undefined) return exchangeRate;
    throw new ValidationException({
      label: 'Exchange Rate Required',
      detail: `The order is in ${currencyCode}; enter how much 1 ${currencyCode} is in ${leCurrencyCode}.`,
      errors: [{ field: 'exchangeRate', message: `1 ${currencyCode} in ${leCurrencyCode}` }],
    });
  }

  // Deletes a draft purchase order
  async delete(po: PurchaseOrderRow): Promise<SuccessResponseDto> {
    if (po.status !== PurchaseOrderStatusValues.DRAFT) {
      throw new BadRequestException({ label: 'Cannot Delete', detail: 'Only draft purchase orders can be deleted.' });
    }
    await this.repository.delete(po.id);
    this.logger.log(`Deleted PO ${po.poNumber} (${po.id})`);
    return { success: true, message: `Purchase order "${po.poNumber}" deleted successfully.` };
  }

  // Deletes a PO a purchase created while none of its receipts is posted, with its lines, in the caller's
  // transaction; the caller has removed every delivery, receipt and invoice line of it
  async deleteForPurchase(po: PurchaseOrderRow): Promise<void> {
    if (po.purchaseId === null || po.hasPostedGoodsReceipt) {
      throw new ConflictException({
        label: 'Cannot Delete',
        detail: `"${po.poNumber}" has a posted goods receipt or was not created by a purchase, so it stays.`,
      });
    }
    await this.repository.delete(po.id);
    this.logger.log(`Deleted PO ${po.poNumber} (${po.id}) of purchase ${po.purchaseId}`);
  }

  // Rejects cancelling a PO goods have been received against; its delivery is marked completed instead
  private assertCancellable(po: Pick<PurchaseOrder, 'poNumber' | 'receiptStatus'>): void {
    if (po.receiptStatus === PurchaseOrderReceiptStatusValues.NOT_RECEIVED) return;
    throw new BadRequestException({
      label: 'Cannot Cancel',
      detail: `Goods have been received against "${po.poNumber}". Mark its delivery completed instead.`,
    });
  }

  // Rejects a change to what the PO's receipts are costed at once one of them is posted
  private assertPricingUnlocked(po: Pick<PurchaseOrderRow, 'poNumber' | 'hasPostedGoodsReceipt'>, label: string): void {
    if (!po.hasPostedGoodsReceipt) return;
    throw new BadRequestException({
      label,
      detail: `A goods receipt of "${po.poNumber}" is posted, so its supplier, prices and rates are locked.`,
    });
  }

  // Rejects a supplier change unless the PO is a draft without lines and none of its receipts is posted
  private assertSupplierChangeable(po: PurchaseOrderRow): void {
    if (po.status !== PurchaseOrderStatusValues.DRAFT) {
      throw new BadRequestException({
        label: 'Cannot Change Supplier',
        detail: 'The supplier can only be changed while the purchase order is a draft.',
      });
    }
    if (po.itemCount > 0) {
      throw new BadRequestException({
        label: 'Cannot Change Supplier',
        detail: 'Remove all line items before changing the supplier.',
      });
    }
    this.assertPricingUnlocked(po, 'Cannot Change Supplier');
  }

  // Rejects a tax date change once the PO is past confirmation or one of its receipts is posted
  private assertTaxDateEditable(po: Pick<PurchaseOrderRow, 'poNumber' | 'status' | 'hasPostedGoodsReceipt'>): void {
    const isEditableStatus = PurchaseOrdersDomainService.TAX_DATE_EDITABLE_STATUSES.includes(po.status);
    if (isEditableStatus && !po.hasPostedGoodsReceipt) return;
    throw new BadRequestException({
      label: 'Cannot Change Tax Date',
      detail: `"${po.poNumber}" is ${po.status} or has a posted goods receipt, so its tax date is locked.`,
      errors: [{ field: 'taxDate', message: 'Locked' }],
    });
  }
}
