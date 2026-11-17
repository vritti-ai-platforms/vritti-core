import type { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import { GoodsReceiptsDomainService } from '@domain/goods-receipts/services/goods-receipts.service';
import { InboundDeliveriesDomainService } from '@domain/inbound-deliveries/services/inbound-deliveries.service';
import { InboundDeliveryLinesDomainService } from '@domain/inbound-deliveries/services/inbound-delivery-lines.service';
import { InventoryItemSitesDomainRepository } from '@domain/inventory-item-sites/repositories/inventory-item-sites.repository';
import type { AllocationWithLegRow } from '@domain/purchase-item-allocations/repositories/purchase-item-allocations.repository';
import { PurchaseItemAllocationsDomainRepository } from '@domain/purchase-item-allocations/repositories/purchase-item-allocations.repository';
import { PurchaseItemAllocationsDomainService } from '@domain/purchase-item-allocations/services/purchase-item-allocations.service';
import type { PurchaseOrderItemRow } from '@domain/purchase-order-items/repositories/purchase-order-items.repository';
import {
  type OrderedPurchaseOrderLine,
  PurchaseOrderItemsDomainService,
} from '@domain/purchase-order-items/services/purchase-order-items.service';
import {
  type PurchaseOrderForPurchase,
  PurchaseOrdersDomainService,
} from '@domain/purchase-orders/services/purchase-orders.service';
import type { PurchaseRow } from '@domain/purchases/repositories/purchases.repository';
import { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import { Injectable } from '@nestjs/common';
import Decimal from '@vritti/api-sdk/decimal';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import type { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';
import { addDays, formatISO, parseISO } from 'date-fns';
import { InboundDeliverySourceValues, type PurchaseOrder, type PurchaseSupplier } from '@/db/schema';
import { PurchasingRulesService } from '@/modules/site/purchasing-rules/services/purchasing-rules.service';

export interface PurchaseSiteContext {
  leCurrencyCode: string;
}

export interface PurchaseOrderTerms {
  orderDate: string;
  status: PurchaseOrderForPurchase['status'];
  exchangeRates: Map<string, number>;
  expectedDeliveryDate?: string;
  currencyCode?: string;
  prices?: Map<string, CurrencyAmountDto>;
}

export interface PlannedPurchaseOrder {
  currencyCode: string;
  exchangeRate: number;
  lines: (OrderedPurchaseOrderLine & { allocationId: string })[];
}

export interface PurchaseOrdersPlan {
  paymentTermId: string;
  orders: PlannedPurchaseOrder[];
}

export interface PurchaseReceiptInput {
  receivedDate: string;
  supplierDeliveryNoteNumber?: string | null;
  supplierDeliveryNoteDate?: string | null;
}

type DocumentLeg = Pick<PurchaseSupplier, 'id' | 'supplierId'>;

@Injectable()
export class PurchaseLegDocumentsService {
  constructor(
    private readonly allocationsService: PurchaseItemAllocationsDomainService,
    private readonly allocationsRepository: PurchaseItemAllocationsDomainRepository,
    private readonly purchaseOrdersService: PurchaseOrdersDomainService,
    private readonly purchaseOrderItemsService: PurchaseOrderItemsDomainService,
    private readonly deliveriesService: InboundDeliveriesDomainService,
    private readonly deliveryLinesService: InboundDeliveryLinesDomainService,
    private readonly goodsReceiptsService: GoodsReceiptsDomainService,
    private readonly supplierEnrollmentsService: SupplierEnrollmentsDomainService,
    private readonly supplierItemsService: SupplierItemsDomainService,
    private readonly purchasingRulesService: PurchasingRulesService,
    private readonly inventoryItemSitesRepository: InventoryItemSitesDomainRepository,
  ) {}

  // Creates the planned POs with their lines and points each allocation at its line, then records what they ordered when
  // the site updates supplier items from its orders, in the caller's transaction
  async createOrders(
    purchase: PurchaseRow,
    leg: DocumentLeg,
    plan: PurchaseOrdersPlan,
    terms: PurchaseOrderTerms,
  ): Promise<PurchaseOrder[]> {
    const created: PurchaseOrder[] = [];
    for (const order of plan.orders) {
      const po = await this.purchaseOrdersService.createForPurchase({
        purchaseId: purchase.id,
        siteId: purchase.siteId,
        supplierId: leg.supplierId,
        paymentTermId: plan.paymentTermId,
        currencyCode: order.currencyCode,
        exchangeRate: order.exchangeRate,
        orderDate: terms.orderDate,
        status: terms.status,
      });
      const lines = await this.purchaseOrderItemsService.addOrderedLines(
        { ...po, hasPostedGoodsReceipt: false },
        order.lines,
      );
      await this.purchaseOrdersService.syncTotalAmount(po.id);
      await this.allocationsService.linkOrderLines(
        order.lines.map((line, index) => ({ allocationId: line.allocationId, purchaseOrderItemId: lines[index].id })),
      );
      await this.purchasingRulesService.recordSentOrder(
        { siteId: purchase.siteId, supplierId: leg.supplierId, poNumber: po.poNumber, orderDate: terms.orderDate },
        lines,
      );
      created.push(po);
    }
    return created;
  }

  // Receives a leg's open confirmed PO lines: a delivery created behind the receipt with each line at what it still has
  // free to receive, then a draft receipt of it, in the caller's transaction
  async receiveOpenLines(
    purchase: PurchaseRow,
    leg: DocumentLeg,
    orderLines: PurchaseOrderItemRow[],
    remainingByLine: Map<string, number>,
    input: PurchaseReceiptInput,
  ): Promise<CreateResponseDto<GoodsReceiptDto>> {
    const open = orderLines.filter((line) => (remainingByLine.get(line.id) ?? 0) > 0);
    if (open.length === 0) {
      throw new BadRequestException({
        label: 'Nothing to Receive',
        detail: `No confirmed line of "${purchase.purchaseNumber}" has quantity left to receive from this supplier.`,
      });
    }
    const delivery = await this.deliveriesService.createForPurchase({
      purchaseId: purchase.id,
      supplierId: leg.supplierId,
      siteId: purchase.siteId,
      source: InboundDeliverySourceValues.GOODS_RECEIPT,
      expectedDeliveryDate: this.dateOf(input.receivedDate),
      supplierDeliveryNoteNumber: input.supplierDeliveryNoteNumber,
      supplierDeliveryNoteDate: input.supplierDeliveryNoteDate,
    });
    await this.deliveryLinesService.addForPurchase(
      delivery,
      open.map((line) => {
        const remaining = new Decimal(remainingByLine.get(line.id) ?? 0);
        return {
          purchaseOrderItemId: line.id,
          quantity: remaining
            .times(line.uomQty)
            .dividedBy(line.primaryUomQty)
            .toDecimalPlaces(3, Decimal.ROUND_HALF_UP)
            .toNumber(),
          primaryUomQty: remaining.toNumber(),
        };
      }),
    );
    return this.receiveDelivery(purchase, delivery.id, input.receivedDate);
  }

  // Drafts a receipt of a purchase's delivery with what is still open on each of its lines, in the caller's transaction
  async receiveDelivery(
    purchase: PurchaseRow,
    inboundDeliveryId: string,
    receivedDate: string,
  ): Promise<CreateResponseDto<GoodsReceiptDto>> {
    const delivery = await this.deliveriesService.findDetailOrThrow(inboundDeliveryId);
    const lines = await this.deliveryLinesService.findReceivableOrThrow(delivery);
    return this.goodsReceiptsService.createDraft({
      purchaseId: purchase.id,
      supplierId: delivery.supplierId,
      inboundDeliveryId: delivery.id,
      siteId: delivery.siteId,
      legalEntityId: delivery.legalEntityId,
      receivedDate,
      lines,
    });
  }

  // Checks a leg's allocations can be ordered and plans one PO per currency: the supplier is still purchasable at the
  // site, its items are enabled and supplied there, every line is priced and a foreign currency has a rate; each line is
  // expected on the given date or after the item's lead time at the site
  async planOrders(
    purchase: PurchaseRow,
    leg: DocumentLeg,
    allocations: AllocationWithLegRow[],
    terms: PurchaseOrderTerms,
    site: PurchaseSiteContext,
  ): Promise<PurchaseOrdersPlan> {
    await this.supplierEnrollmentsService.assertPurchasable(leg.supplierId, purchase.siteId);
    const enrollment = await this.supplierEnrollmentsService.findBySupplierAndSiteOrThrow(
      leg.supplierId,
      purchase.siteId,
    );
    const itemIds = _.uniq(allocations.map((allocation) => allocation.inventoryItemId));
    await this.inventoryItemSitesRepository.ensurePurchasable(itemIds, 'allocations', purchase.siteId);
    await this.purchasingRulesService.assertSourced(leg.supplierId, purchase.siteId, allocations, 'allocations');
    const leadTimes = await this.supplierItemsService.findSiteLeadTimes(leg.supplierId, purchase.siteId, allocations);

    const byCurrency = _.groupBy(allocations, (allocation) => terms.currencyCode ?? allocation.currencyCode);
    this.assertRatesGiven(Object.keys(byCurrency), terms.exchangeRates, site.leCurrencyCode);
    const orders = Object.entries(byCurrency).map(([currencyCode, currencyAllocations]) => ({
      currencyCode,
      exchangeRate: this.purchaseOrdersService.resolveExchangeRateOrThrow(
        currencyCode,
        site.leCurrencyCode,
        terms.exchangeRates.get(currencyCode),
      ),
      lines: currencyAllocations.map((allocation) => ({
        allocationId: allocation.id,
        inventoryItemId: allocation.inventoryItemId,
        uomId: allocation.uomId,
        uomQty: allocation.uomQty,
        primaryUomQty: allocation.primaryUomQty,
        unitPrice: terms.prices?.get(allocation.id) ?? this.allocationsRepository.requireUnitPrice(allocation),
        scheme: {
          buyQty: allocation.schemeBuyQty,
          freeQty: allocation.schemeFreeQty,
          hasScheme: allocation.hasScheme,
        },
        expectedDeliveryDate:
          terms.expectedDeliveryDate ??
          this.dateAfter(terms.orderDate, leadTimes.get(SupplierItemsDomainService.leadTimeKey(allocation)) ?? 0),
      })),
    }));
    return { paymentTermId: enrollment.paymentTermId, orders };
  }

  // Returns the calendar date of a date-time
  dateOf(dateTime: string): string {
    return formatISO(parseISO(dateTime), { representation: 'date' });
  }

  // Rejects ordering in a currency other than the legal entity's without its rate, naming the currencies
  private assertRatesGiven(currencyCodes: string[], rates: Map<string, number>, leCurrencyCode: string): void {
    const missing = currencyCodes.filter((currencyCode) => currencyCode !== leCurrencyCode && !rates.has(currencyCode));
    if (missing.length === 0) return;
    throw new BadRequestException({
      label: 'Exchange Rate Required',
      detail: `Enter how much 1 ${missing.join(', 1 ')} is in ${leCurrencyCode} to order in ${missing.join(' and ')}.`,
      errors: [{ field: 'exchangeRates', message: `Rate for ${missing.join(', ')}` }],
    });
  }

  // Returns the date a number of days after a date
  private dateAfter(date: string, days: number): string {
    return formatISO(addDays(parseISO(date), days), { representation: 'date' });
  }
}
