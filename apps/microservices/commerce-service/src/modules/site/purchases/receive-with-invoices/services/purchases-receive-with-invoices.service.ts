import type { GoodsReceiptLineRow } from '@domain/goods-receipt-lines/repositories/goods-receipt-lines.repository';
import { GoodsReceiptLinesDomainService } from '@domain/goods-receipt-lines/services/goods-receipt-lines.service';
import { GoodsReceiptsDomainService } from '@domain/goods-receipts/services/goods-receipts.service';
import { InboundDeliveryLinesDomainService } from '@domain/inbound-deliveries/services/inbound-delivery-lines.service';
import { LocationsDomainService } from '@domain/locations/services/locations.service';
import { PaymentTermRulesDomainService } from '@domain/payment-term-rules/services/payment-term-rules.service';
import { PaymentTermsDomainService } from '@domain/payment-terms/services/payment-terms.service';
import {
  type PurchaseEventAction,
  PurchaseEventActionValues,
  PurchaseEventDocumentTypeValues,
} from '@domain/purchase-events/dto/entity/purchase-event.dto';
import type { AllocationWithLegRow } from '@domain/purchase-item-allocations/repositories/purchase-item-allocations.repository';
import { PurchaseItemAllocationsDomainService } from '@domain/purchase-item-allocations/services/purchase-item-allocations.service';
import { PurchaseOrdersDomainService } from '@domain/purchase-orders/services/purchase-orders.service';
import { PurchaseTypeLabels } from '@domain/purchase-suppliers/dto/entity/purchase-supplier.dto';
import { PurchaseSuppliersDomainService } from '@domain/purchase-suppliers/services/purchase-suppliers.service';
import type {
  ReceiveWithInvoiceDto,
  ReceiveWithInvoiceLineDto,
} from '@domain/purchases/dto/request/receive-with-invoice.dto';
import type { ReceiveWithInvoiceOpenLinesQueryDto } from '@domain/purchases/dto/request/receive-with-invoice-open-lines-query.dto';
import type { UpdateReceiveWithInvoiceDto } from '@domain/purchases/dto/request/update-receive-with-invoice.dto';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import type { CreateSupplierInvoiceDto } from '@domain/supplier-invoices/dto/request/create-supplier-invoice.dto';
import type { UpdateSupplierInvoiceDto } from '@domain/supplier-invoices/dto/request/update-supplier-invoice.dto';
import type { SupplierInvoiceRow } from '@domain/supplier-invoices/repositories/supplier-invoices.repository';
import { SupplierInvoiceHoldsDomainService } from '@domain/supplier-invoices/services/supplier-invoice-holds.service';
import type { InvoiceForLines } from '@domain/supplier-invoices/services/supplier-invoice-lines.service';
import { SupplierInvoicesDomainService } from '@domain/supplier-invoices/services/supplier-invoices.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import type { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { NatsHeaders } from '@vritti/api-sdk/nats';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import {
  InventoryTrackingValues,
  PurchaseOrderStatusValues,
  PurchaseStatusValues,
  type PurchaseSupplier,
  PurchaseTypeValues,
  SupplierInvoiceLineTypeValues,
  SupplierInvoiceStatusValues,
} from '@/db/schema';
import { GoodsReceiptsPostService } from '@/modules/site/goods-receipts/root/services/goods-receipts-post.service';
import { PurchaseProgressService } from '@/modules/site/purchase-progress/services/purchase-progress.service';
import { SupplierInvoicesService } from '@/modules/site/suppliers/invoices/root/services/supplier-invoices.service';
import {
  PurchaseLegDocumentsService,
  type PurchaseSiteContext,
} from '../../legs/services/purchase-leg-documents.service';
import {
  ReceiveWithInvoiceDetailDto,
  ReceiveWithInvoiceDetailLineDto,
} from '../dto/entity/receive-with-invoice-detail.dto';
import { ReceiveWithInvoiceOpenLineDto } from '../dto/entity/receive-with-invoice-open-line.dto';
import {
  type ReceiveWithInvoiceDocuments,
  ReceiveWithInvoiceDocumentsService,
  type ReceiveWithInvoiceLinePlan,
  type ReceiveWithInvoiceLot,
  type ReceiveWithInvoicePurchasePlan,
} from './receive-with-invoice-documents.service';

export interface ReceiveWithInvoiceSite extends PurchaseSiteContext {
  siteId: string;
}

@Injectable()
export class PurchasesReceiveWithInvoicesService {
  private readonly logger = new Logger(PurchasesReceiveWithInvoicesService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly purchasesService: PurchasesDomainService,
    private readonly legsService: PurchaseSuppliersDomainService,
    private readonly allocationsService: PurchaseItemAllocationsDomainService,
    private readonly purchaseOrdersService: PurchaseOrdersDomainService,
    private readonly deliveryLinesService: InboundDeliveryLinesDomainService,
    private readonly goodsReceiptsService: GoodsReceiptsDomainService,
    private readonly receiptLinesService: GoodsReceiptLinesDomainService,
    private readonly invoicesService: SupplierInvoicesDomainService,
    private readonly holdsService: SupplierInvoiceHoldsDomainService,
    private readonly supplierEnrollmentsService: SupplierEnrollmentsDomainService,
    private readonly locationsService: LocationsDomainService,
    private readonly paymentTermsService: PaymentTermsDomainService,
    private readonly paymentTermRulesService: PaymentTermRulesDomainService,
    private readonly supplierInvoicesService: SupplierInvoicesService,
    private readonly postService: GoodsReceiptsPostService,
    private readonly progressService: PurchaseProgressService,
    private readonly legDocumentsService: PurchaseLegDocumentsService,
    private readonly invoiceDocumentsService: ReceiveWithInvoiceDocumentsService,
  ) {}

  // Returns the supplier's allocations at the site an invoice may still receive, with what is open of each: allocated less
  // received less what other draft invoices carry (the excluded invoice's own lines count as open)
  async findOpenLines(
    query: ReceiveWithInvoiceOpenLinesQueryDto,
    siteId: string,
  ): Promise<ReceiveWithInvoiceOpenLineDto[]> {
    const allocations = (
      await this.allocationsService.findWithLegs({
        supplierId: query.supplierId,
        siteId,
        legTypes: PurchaseSuppliersDomainService.RECEIVE_WITH_INVOICE_TYPES,
      })
    ).filter((allocation) => this.receivableReason(allocation) === null);
    const excludedDeliveryIds = query.excludeInvoiceId
      ? (await this.invoiceDocumentsService.findDocuments(query.excludeInvoiceId)).receipts.map(
          (receipt) => receipt.inboundDeliveryId,
        )
      : [];
    const pending = await this.deliveryLinesService.findPendingOnSupplierInvoices(
      allocations.flatMap((allocation) => (allocation.purchaseOrderItemId ? [allocation.purchaseOrderItemId] : [])),
      excludedDeliveryIds,
    );
    return allocations
      .map((allocation) =>
        ReceiveWithInvoiceOpenLineDto.from(
          allocation,
          allocation.purchaseOrderItemId ? (pending.get(allocation.purchaseOrderItemId) ?? 0) : 0,
        ),
      )
      .filter((line) => line.openQty > 0);
  }

  // Drafts a supplier's invoice entered with its goods: per purchase it touches, a direct purchase's PO of the invoiced
  // allocations not ordered yet, a delivery created behind the invoice and a draft receipt of it; and one draft invoice
  // whose lines name what each receipt puts away, all in one transaction
  async create(
    dto: ReceiveWithInvoiceDto,
    site: ReceiveWithInvoiceSite,
    headers: NatsHeaders,
  ): Promise<CreateResponseDto<{ supplierInvoiceId: string }>> {
    const plans = await this.planReceiveWithInvoice(dto, site);
    const invoiceId = await this.database.runInTransaction(async () => {
      const { data: invoice } = await this.supplierInvoicesService.create(this.invoiceHeaderOf(dto), {
        siteId: site.siteId,
        leCurrencyCode: site.leCurrencyCode,
        createdBy: headers.userId || null,
      });
      await this.buildDocuments(invoice, dto, plans, site.leCurrencyCode, headers);
      return invoice.id;
    });
    this.logger.log(`purchases.receiveWithInvoices.create — ${dto.invoiceNumber}, purchases: ${plans.length}`);
    return {
      success: true,
      message: `Invoice "${dto.invoiceNumber}" drafted with its goods across ${pluralize('purchase', plans.length, true)}.`,
      data: { supplierInvoiceId: invoiceId },
    };
  }

  // Returns a Receive with Invoice with its lines (batch and location from its receipts), purchases, receipts and holds
  async findById(invoiceId: string, leCurrencyCode: string): Promise<ReceiveWithInvoiceDetailDto> {
    const invoice = await this.findReceiveWithInvoiceOrThrow(invoiceId);
    const documents = await this.invoiceDocumentsService.findDocuments(invoice.id);
    const allocations = await this.allocationsService.findWithLegs({
      supplierId: invoice.supplierId,
      siteId: invoice.siteId,
    });
    const receiptLines = await this.findReceiptLines(documents);
    const { holds } = await this.invoicesService.findById(invoice.id, leCurrencyCode);
    const lines = documents.lines
      .filter((line) => line.lineType === SupplierInvoiceLineTypeValues.ITEM)
      .flatMap((line) =>
        allocations
          .filter((allocation) => allocation.purchaseOrderItemId === line.purchaseOrderItemId)
          .map((allocation) =>
            ReceiveWithInvoiceDetailLineDto.from(
              line,
              allocation,
              receiptLines.find(
                (receiptLine) =>
                  receiptLine.goodsReceiptItemId === line.goodsReceiptItemId &&
                  receiptLine.goodsReceiptLotId === line.goodsReceiptLotId,
              ),
              invoice.currencyCode,
              leCurrencyCode,
            ),
          ),
      );
    return ReceiveWithInvoiceDetailDto.from(invoice, {
      status:
        invoice.status === SupplierInvoiceStatusValues.POSTED
          ? SupplierInvoiceStatusValues.POSTED
          : SupplierInvoiceStatusValues.DRAFT,
      leCurrencyCode,
      receipts: documents.receipts,
      lines,
      holds,
    });
  }

  // Replaces a draft Receive with Invoice: its header changes and its receipts, deliveries and invoice lines are drafted again
  // from the invoice, in one transaction; the supplier and currency stay
  async update(
    dto: UpdateReceiveWithInvoiceDto,
    site: PurchaseSiteContext,
    headers: NatsHeaders,
  ): Promise<SuccessResponseDto> {
    const invoice = await this.findDraftReceiveWithInvoiceOrThrow(dto.invoiceId);
    this.assertSameSupplierAndCurrency(invoice, dto);
    const documents = await this.invoiceDocumentsService.findDocuments(invoice.id);
    const plans = await this.planReceiveWithInvoice(dto, { ...site, siteId: invoice.siteId });
    const header: UpdateSupplierInvoiceDto = {
      id: invoice.id,
      invoiceNumber: dto.invoiceNumber,
      invoiceDate: dto.invoiceDate,
      taxDate: dto.taxDate ?? dto.invoiceDate,
      notes: dto.notes,
      exchangeRate: this.purchaseOrdersService.resolveExchangeRateOrThrow(
        invoice.currencyCode,
        site.leCurrencyCode,
        dto.exchangeRate,
      ),
    };
    await this.invoicesService.assertUpdatable(invoice, header, site.leCurrencyCode);
    const paymentTerm = await this.paymentTermsService.findByIdOrThrow(invoice.paymentTermId);
    const dueDate = await this.paymentTermRulesService.findFinalDueDate(paymentTerm, dto.invoiceDate);
    const directLegs = await this.findLegsOf(invoice);

    await this.database.runInTransaction(async () => {
      await this.invoiceDocumentsService.remove(invoice, documents, true);
      await this.invoicesService.update(invoice, header, dueDate);
      await this.buildDocuments(
        { ...invoice, invoiceNumber: dto.invoiceNumber },
        dto,
        plans,
        site.leCurrencyCode,
        headers,
      );
      for (const leg of [...directLegs, ...plans.map((plan) => plan.leg)]) {
        await this.invoiceDocumentsService.removeEmptyOrders(leg);
      }
    });
    this.logger.log(`purchases.receiveWithInvoices.update — ${dto.invoiceNumber}, purchases: ${plans.length}`);
    return { success: true, message: `Invoice "${dto.invoiceNumber}" updated.` };
  }

  // Posts a draft Receive with Invoice: posts each of its receipts (stock lands, PO counters move) and then posts its
  // invoice (cost settles, holds are computed) in one transaction, in its site's context; holds never block posting
  async post(invoiceId: string, leCurrencyCode: string, headers: NatsHeaders): Promise<SuccessResponseDto> {
    const invoice = await this.findDraftReceiveWithInvoiceOrThrow(invoiceId);
    const { receipts } = await this.invoiceDocumentsService.findDocuments(invoice.id);
    for (const receipt of receipts) this.goodsReceiptsService.assertPostable(receipt);
    const actorId = headers.userId || null;

    await this.postService.inSiteContext(receipts[0], leCurrencyCode, headers, () =>
      this.database.runInTransaction(async () => {
        for (const receipt of receipts) {
          const landing = await this.postService.prepareLanding(receipt, leCurrencyCode);
          await this.postService.land(receipt, landing, leCurrencyCode);
        }
        const posted = await this.invoicesService.findDraftOrThrow(invoice.id, 'post');
        await this.invoicesService.assertPostable(posted, leCurrencyCode);
        await this.supplierInvoicesService.postDraft(posted, leCurrencyCode, actorId);
        await this.notifyPurchases(invoice, PurchaseEventActionValues.POST_RECEIVE_WITH_INVOICE, actorId);
      }),
    );
    this.logger.log(`purchases.receiveWithInvoices.post — ${invoice.invoiceNumber}, receipts: ${receipts.length}`);
    return { success: true, message: `Invoice "${invoice.invoiceNumber}" posted with its goods.` };
  }

  // Discards a draft Receive with Invoice: its invoice, draft receipts and the deliveries created behind them, and a direct
  // purchase's PO it created once nothing else of it remains, in one transaction
  async discard(invoiceId: string, headers: NatsHeaders): Promise<SuccessResponseDto> {
    const invoice = await this.findDraftReceiveWithInvoiceOrThrow(invoiceId);
    const documents = await this.invoiceDocumentsService.findDocuments(invoice.id);
    const legs = await this.findLegsOf(invoice);
    await this.database.runInTransaction(async () => {
      await this.invoiceDocumentsService.remove(invoice, documents, false);
      for (const leg of legs) await this.invoiceDocumentsService.removeEmptyOrders(leg);
      await this.notifyPurchases(
        invoice,
        PurchaseEventActionValues.DISCARD_RECEIVE_WITH_INVOICE,
        headers.userId || null,
      );
    });
    this.logger.log(`purchases.receiveWithInvoices.discard — ${invoice.invoiceNumber}`);
    return { success: true, message: `Invoice "${invoice.invoiceNumber}" discarded.` };
  }

  // Checks an invoice and plans what it drafts per purchase: the supplier is purchasable at the site, a foreign invoice has a
  // rate, every location is the site's, every line receives an open allocation of the supplier's legs that receive with
  // their invoice, lot-tracked items carry a batch, and a direct purchase's unordered allocations are ordered in the invoice's
  // currency at the invoice's prices
  private async planReceiveWithInvoice(
    dto: ReceiveWithInvoiceDto,
    site: ReceiveWithInvoiceSite,
  ): Promise<ReceiveWithInvoicePurchasePlan[]> {
    await this.supplierEnrollmentsService.assertPurchasable(dto.supplierId, site.siteId);
    this.purchaseOrdersService.resolveExchangeRateOrThrow(dto.currencyCode, site.leCurrencyCode, dto.exchangeRate);
    await this.assertLocationsAtSite(dto, site.siteId);
    const allocations = await this.allocationsService.findWithLegs({
      supplierId: dto.supplierId,
      siteId: site.siteId,
      allocationIds: _.uniq(dto.lines.map((line) => line.allocationId)),
    });
    const lines = dto.lines.map((line) => this.planLine(dto, line, allocations));
    this.assertNoRepeatedLines(lines);

    const plans: ReceiveWithInvoicePurchasePlan[] = [];
    for (const purchaseLines of Object.values(_.groupBy(lines, (planned) => planned.allocation.purchaseId))) {
      const [{ allocation }] = purchaseLines;
      const purchase = await this.purchasesService.findDetailOrThrow(allocation.purchaseId);
      const leg = await this.legsService.findOnPurchaseOrThrow(purchase.id, allocation.purchaseSupplierId);
      const unordered = _.uniqBy(
        purchaseLines.filter((planned) => planned.allocation.purchaseOrderItemId === null),
        (planned) => planned.allocation.id,
      );
      const terms = {
        orderDate: this.legDocumentsService.dateOf(dto.receivedDate),
        expectedDeliveryDate: this.legDocumentsService.dateOf(dto.receivedDate),
        status: PurchaseOrderStatusValues.CONFIRMED,
        currencyCode: dto.currencyCode,
        exchangeRates: new Map(dto.exchangeRate === undefined ? [] : [[dto.currencyCode, dto.exchangeRate]]),
        prices: new Map<string, CurrencyAmountDto>(
          unordered.map((planned) => [planned.allocation.id, planned.line.unitPrice]),
        ),
      };
      const orders =
        unordered.length > 0
          ? {
              plan: await this.legDocumentsService.planOrders(
                purchase,
                leg,
                unordered.map((planned) => planned.allocation),
                terms,
                site,
              ),
              terms,
            }
          : null;
      plans.push({ purchase, leg, orders, lines: purchaseLines });
    }
    return plans;
  }

  // Drafts each purchase's documents of an invoice, computes the invoice's holds and records the invoice on every purchase it
  // touches, in the caller's transaction
  private async buildDocuments(
    invoice: InvoiceForLines,
    dto: ReceiveWithInvoiceDto,
    plans: ReceiveWithInvoicePurchasePlan[],
    leCurrencyCode: string,
    headers: NatsHeaders,
  ): Promise<void> {
    for (const [index, plan] of plans.entries()) {
      await this.invoiceDocumentsService.build(invoice, dto, plan, index === 0, leCurrencyCode);
    }
    await this.holdsService.sync(invoice.id, leCurrencyCode);
    for (const plan of plans) {
      await this.progressService.recordLegEvent(
        plan.purchase,
        plan.leg,
        {
          action: PurchaseEventActionValues.CREATE_RECEIVE_WITH_INVOICE,
          documentType: PurchaseEventDocumentTypeValues.SUPPLIER_INVOICE,
          documentId: invoice.id,
        },
        headers.userId || null,
      );
    }
  }

  // Checks one invoice line against the allocation it receives and works out its batch and location
  private planLine(
    dto: ReceiveWithInvoiceDto,
    line: ReceiveWithInvoiceLineDto,
    allocations: AllocationWithLegRow[],
  ): ReceiveWithInvoiceLinePlan {
    const allocation = allocations.find((candidate) => candidate.id === line.allocationId);
    if (!allocation) {
      throw new BadRequestException({
        label: 'Allocation Not Found',
        detail: "An invoice line names an allocation that is not one of this supplier's allocations at this site.",
        errors: [{ field: 'lines', message: 'Unknown allocation' }],
      });
    }
    const reason = this.receivableReason(allocation);
    if (reason) {
      throw new ConflictException({ label: 'Not Receivable with Invoice', detail: reason });
    }
    if (allocation.purchaseOrderCurrencyCode !== null && allocation.purchaseOrderCurrencyCode !== dto.currencyCode) {
      throw new BadRequestException({
        label: 'Different Currency',
        detail: `"${allocation.inventoryItemName}" on "${allocation.purchaseNumber}" is ordered in ${allocation.purchaseOrderCurrencyCode}; this invoice is in ${dto.currencyCode}.`,
        errors: [{ field: 'currencyCode', message: `Order in ${allocation.purchaseOrderCurrencyCode}` }],
      });
    }
    return {
      line,
      allocation,
      locationId: line.locationId ?? dto.defaultLocationId,
      lot: this.lotOf(allocation, line),
    };
  }

  // Explains why an allocation cannot be received with an invoice, or returns null when it can: its purchase and leg are
  // open and fulfilling, its leg receives with its invoice, and an order invoiced with the goods is confirmed
  private receivableReason(allocation: AllocationWithLegRow): string | null {
    const name = `"${allocation.inventoryItemName}" on "${allocation.purchaseNumber}"`;
    const leg = {
      id: allocation.purchaseSupplierId,
      type: allocation.legType,
      step: allocation.legStep,
      status: allocation.legStatus,
    };
    if (!PurchaseSuppliersDomainService.RECEIVE_WITH_INVOICE_TYPES.includes(allocation.legType)) {
      return `${name} is with a supplier set to "${PurchaseTypeLabels[allocation.legType]}", which is not received with its invoice.`;
    }
    if (allocation.purchaseStatus !== PurchaseStatusValues.OPEN) {
      return `${name} is not open for receiving: the purchase is ${allocation.purchaseStatus.toLowerCase()}.`;
    }
    if (!this.legsService.isFulfilling(leg)) {
      return `${name} is not open for receiving: its supplier is ${this.legsService.describeState(leg)}.`;
    }
    const mustBeConfirmed = allocation.legType === PurchaseTypeValues.ORDER_INVOICE_WITH_GOODS;
    if (mustBeConfirmed && allocation.purchaseOrderStatus !== PurchaseOrderStatusValues.CONFIRMED) {
      return `${name} is not on a confirmed purchase order yet. Order it and confirm the order first.`;
    }
    return null;
  }

  // Returns the batch a lot-tracked item's invoice line puts away, rejecting one without a batch number or expiry, or an
  // item tracked by serial, which an invoice does not capture
  private lotOf(allocation: AllocationWithLegRow, line: ReceiveWithInvoiceLineDto): ReceiveWithInvoiceLot | null {
    const isSerialTracked =
      allocation.tracking === InventoryTrackingValues.SERIAL ||
      allocation.tracking === InventoryTrackingValues.LOT_SERIAL;
    if (isSerialTracked) {
      throw new BadRequestException({
        label: 'Serials Not Supported',
        detail: `"${allocation.inventoryItemName}" is tracked by serial; receive it in Goods Receipts, where serials are scanned.`,
        errors: [{ field: 'lines', message: 'Serial-tracked item' }],
      });
    }
    if (!ReceiveWithInvoiceOpenLineDto.isLotTracked(allocation)) return null;
    if (!line.lotNumber || !line.expiryDate) {
      throw new BadRequestException({
        label: 'Batch Required',
        detail: `"${allocation.inventoryItemName}" is tracked by lot; enter the batch number and expiry date of each line.`,
        errors: [{ field: 'lines', message: 'Batch and expiry required' }],
      });
    }
    return {
      lotNumber: line.lotNumber,
      expiryDate: line.expiryDate,
      manufacturingDate: line.manufacturingDate ?? null,
      mrp: line.mrp ?? null,
    };
  }

  // Rejects an item without lots invoiced on two lines, or a batch invoiced twice for the same allocation
  private assertNoRepeatedLines(lines: ReceiveWithInvoiceLinePlan[]): void {
    const keys = lines.map((planned) => `${planned.allocation.id}:${planned.lot?.lotNumber ?? ''}`);
    if (_.uniq(keys).length === keys.length) return;
    throw new BadRequestException({
      label: 'Repeated Line',
      detail:
        'Each allocation is invoiced once, or once per batch for an item tracked by lot. Combine the repeated lines.',
      errors: [{ field: 'lines', message: 'Repeated allocation or batch' }],
    });
  }

  // Rejects a default or line location that is not the site's
  private async assertLocationsAtSite(dto: ReceiveWithInvoiceDto, siteId: string): Promise<void> {
    await this.locationsService.assertAtSite(siteId, dto.defaultLocationId, 'defaultLocationId');
    const lineLocationIds = _.uniq(dto.lines.flatMap((line) => (line.locationId ? [line.locationId] : [])));
    for (const locationId of lineLocationIds) await this.locationsService.assertAtSite(siteId, locationId, 'lines');
  }

  // Rejects changing the supplier or currency of a drafted invoice; a different one is a new invoice
  private assertSameSupplierAndCurrency(invoice: SupplierInvoiceRow, dto: ReceiveWithInvoiceDto): void {
    if (invoice.supplierId === dto.supplierId && invoice.currencyCode === dto.currencyCode) return;
    throw new BadRequestException({
      label: 'Supplier and Currency Fixed',
      detail: `Invoice "${invoice.invoiceNumber}" stays with its supplier in ${invoice.currencyCode}. Discard it and enter a new invoice instead.`,
      errors: [
        { field: invoice.supplierId === dto.supplierId ? 'currencyCode' : 'supplierId', message: 'Cannot change' },
      ],
    });
  }

  // Returns the supplier invoice header a Receive with Invoice enters
  private invoiceHeaderOf(dto: ReceiveWithInvoiceDto): CreateSupplierInvoiceDto {
    return {
      supplierId: dto.supplierId,
      invoiceNumber: dto.invoiceNumber,
      invoiceDate: dto.invoiceDate,
      taxDate: dto.taxDate,
      currencyCode: dto.currencyCode,
      exchangeRate: dto.exchangeRate,
      notes: dto.notes,
    };
  }

  // Loads the supplier's legs on the purchases an invoice names
  private async findLegsOf(invoice: SupplierInvoiceRow): Promise<PurchaseSupplier[]> {
    const legs: PurchaseSupplier[] = [];
    for (const purchase of invoice.purchases) {
      const leg = await this.legsService.findForSupplier(purchase.id, invoice.supplierId);
      if (leg) legs.push(leg);
    }
    return legs;
  }

  // Loads the receipt lines of an invoice's receipt items, with their lots and locations
  private async findReceiptLines(documents: ReceiveWithInvoiceDocuments): Promise<GoodsReceiptLineRow[]> {
    const itemIds = _.uniq(
      documents.lines.flatMap((line) => (line.goodsReceiptItemId ? [line.goodsReceiptItemId] : [])),
    );
    const lines: GoodsReceiptLineRow[] = [];
    for (const itemId of itemIds) lines.push(...(await this.receiptLinesService.findLinesOfItem(itemId)));
    return lines;
  }

  // Records an invoice event on every purchase it touches and re-derives their legs, in the caller's transaction
  private async notifyPurchases(
    invoice: SupplierInvoiceRow,
    action: PurchaseEventAction,
    actorId: string | null,
  ): Promise<void> {
    for (const purchase of invoice.purchases) {
      await this.progressService.notifyDocument(
        purchase.id,
        invoice.supplierId,
        { action, documentType: PurchaseEventDocumentTypeValues.SUPPLIER_INVOICE, documentId: invoice.id },
        actorId,
      );
    }
  }

  // Loads a Receive with Invoice, throwing when the invoice is out of reach, cancelled or not received with its invoice
  private async findReceiveWithInvoiceOrThrow(invoiceId: string): Promise<SupplierInvoiceRow> {
    const invoice = await this.invoicesService.findDetailOrThrow(invoiceId);
    if (invoice.isReceiveWithInvoice && invoice.status !== SupplierInvoiceStatusValues.CANCELLED) return invoice;
    throw new NotFoundException('Receive with Invoice not found.');
  }

  // Loads a draft Receive with Invoice, the only state it changes, posts or is discarded in
  private async findDraftReceiveWithInvoiceOrThrow(invoiceId: string): Promise<SupplierInvoiceRow> {
    const invoice = await this.findReceiveWithInvoiceOrThrow(invoiceId);
    if (invoice.status === SupplierInvoiceStatusValues.DRAFT) return invoice;
    throw new ConflictException({
      label: 'Invoice Posted',
      detail: `Invoice "${invoice.invoiceNumber}" is posted with its goods; change it in Supplier Invoices.`,
    });
  }
}
