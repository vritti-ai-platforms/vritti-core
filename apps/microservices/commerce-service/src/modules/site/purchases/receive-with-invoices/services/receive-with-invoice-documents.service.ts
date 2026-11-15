import { GoodsReceiptLinesDomainService } from '@domain/goods-receipt-lines/services/goods-receipt-lines.service';
import { GoodsReceiptLotsDomainService } from '@domain/goods-receipt-lots/services/goods-receipt-lots.service';
import type { GoodsReceiptRow } from '@domain/goods-receipts/repositories/goods-receipts.repository';
import { GoodsReceiptItemsDomainService } from '@domain/goods-receipts/services/goods-receipt-items.service';
import { GoodsReceiptsDomainService } from '@domain/goods-receipts/services/goods-receipts.service';
import { InboundDeliveriesDomainService } from '@domain/inbound-deliveries/services/inbound-deliveries.service';
import { InboundDeliveryLinesDomainService } from '@domain/inbound-deliveries/services/inbound-delivery-lines.service';
import type { AllocationWithLegRow } from '@domain/purchase-item-allocations/repositories/purchase-item-allocations.repository';
import { PurchaseItemAllocationsDomainService } from '@domain/purchase-item-allocations/services/purchase-item-allocations.service';
import { PurchaseOrderItemsDomainService } from '@domain/purchase-order-items/services/purchase-order-items.service';
import { PurchaseOrdersDomainService } from '@domain/purchase-orders/services/purchase-orders.service';
import type { PurchaseSupplierRow } from '@domain/purchase-suppliers/repositories/purchase-suppliers.repository';
import type {
  ReceiveWithInvoiceDto,
  ReceiveWithInvoiceLineDto,
} from '@domain/purchases/dto/request/receive-with-invoice.dto';
import type { PurchaseRow } from '@domain/purchases/repositories/purchases.repository';
import type { SupplierInvoiceLineRow } from '@domain/supplier-invoices/repositories/supplier-invoice-lines.repository';
import type { SupplierInvoiceRow } from '@domain/supplier-invoices/repositories/supplier-invoices.repository';
import {
  type InvoiceForLines,
  SupplierInvoiceLinesDomainService,
} from '@domain/supplier-invoices/services/supplier-invoice-lines.service';
import { SupplierInvoicesDomainService } from '@domain/supplier-invoices/services/supplier-invoices.service';
import { Injectable } from '@nestjs/common';
import Decimal from '@vritti/api-sdk/decimal';
import { ConflictException } from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import type { CurrencyAmountDto } from '@vritti/api-sdk/money';
import {
  GoodsReceiptStatusValues,
  InboundDeliverySourceValues,
  PurchaseOrderStatusValues,
  type PurchaseSupplier,
  PurchaseTypeValues,
  SupplierInvoiceLineTypeValues,
} from '@/db/schema';
import {
  PurchaseLegDocumentsService,
  type PurchaseOrdersPlan,
  type PurchaseOrderTerms,
} from '../../legs/services/purchase-leg-documents.service';

export interface ReceiveWithInvoiceLot {
  lotNumber: string;
  expiryDate: string;
  manufacturingDate: string | null;
  mrp: CurrencyAmountDto | null;
}

export interface ReceiveWithInvoiceLinePlan {
  line: ReceiveWithInvoiceLineDto;
  allocation: AllocationWithLegRow;
  locationId: string;
  lot: ReceiveWithInvoiceLot | null;
}

export interface ReceiveWithInvoicePurchasePlan {
  purchase: PurchaseRow;
  leg: PurchaseSupplierRow;
  orders: { plan: PurchaseOrdersPlan; terms: PurchaseOrderTerms } | null;
  lines: ReceiveWithInvoiceLinePlan[];
}

export interface ReceiveWithInvoiceDocuments {
  lines: SupplierInvoiceLineRow[];
  receipts: GoodsReceiptRow[];
}

interface ReceivedQuantities {
  invoicedPrimaryQty: Decimal;
  freePrimaryQty: Decimal;
}

@Injectable()
export class ReceiveWithInvoiceDocumentsService {
  constructor(
    private readonly allocationsService: PurchaseItemAllocationsDomainService,
    private readonly purchaseOrdersService: PurchaseOrdersDomainService,
    private readonly purchaseOrderItemsService: PurchaseOrderItemsDomainService,
    private readonly deliveriesService: InboundDeliveriesDomainService,
    private readonly deliveryLinesService: InboundDeliveryLinesDomainService,
    private readonly goodsReceiptsService: GoodsReceiptsDomainService,
    private readonly goodsReceiptItemsService: GoodsReceiptItemsDomainService,
    private readonly lotsService: GoodsReceiptLotsDomainService,
    private readonly receiptLinesService: GoodsReceiptLinesDomainService,
    private readonly invoicesService: SupplierInvoicesDomainService,
    private readonly invoiceLinesService: SupplierInvoiceLinesDomainService,
    private readonly legDocumentsService: PurchaseLegDocumentsService,
  ) {}

  // Drafts what an invoice receives on one purchase, in the caller's transaction: the POs of a direct purchase's unordered
  // allocations, a delivery created behind the invoice with one line per allocation, a draft receipt of it with one lot (or
  // item line) per invoice line at its location, and the invoice line invoicing each of them
  async build(
    invoice: InvoiceForLines,
    receiveWithInvoice: ReceiveWithInvoiceDto,
    purchasePlan: ReceiveWithInvoicePurchasePlan,
    isFirstPurchase: boolean,
    leCurrencyCode: string,
  ): Promise<string> {
    const { purchase, leg } = purchasePlan;
    if (purchasePlan.orders) {
      await this.legDocumentsService.createOrders(purchase, leg, purchasePlan.orders.plan, purchasePlan.orders.terms);
    }
    const allocations = await this.allocationsService.findWithLegs({
      allocationIds: _.uniq(purchasePlan.lines.map((planned) => planned.allocation.id)),
    });
    const linesByAllocation = _.groupBy(purchasePlan.lines, (planned) => planned.allocation.id);

    const delivery = await this.deliveriesService.createForPurchase({
      purchaseId: purchase.id,
      supplierId: leg.supplierId,
      siteId: purchase.siteId,
      source: InboundDeliverySourceValues.SUPPLIER_INVOICE,
      expectedDeliveryDate: this.legDocumentsService.dateOf(receiveWithInvoice.receivedDate),
      supplierDeliveryNoteNumber: isFirstPurchase ? receiveWithInvoice.supplierDeliveryNoteNumber : null,
    });
    const deliveryLines = await this.deliveryLinesService.addForPurchase(
      delivery,
      allocations.map((allocation) => ({
        purchaseOrderItemId: this.orderLineOf(allocation),
        quantity: this.receivedQtyOf(linesByAllocation[allocation.id]),
        primaryUomQty: this.receivedPrimaryQtyOf(allocation, linesByAllocation[allocation.id]),
      })),
    );
    const receipt = await this.goodsReceiptsService.createDraft({
      purchaseId: purchase.id,
      supplierId: leg.supplierId,
      inboundDeliveryId: delivery.id,
      siteId: purchase.siteId,
      legalEntityId: delivery.legalEntityId,
      receivedDate: receiveWithInvoice.receivedDate,
      notes: receiveWithInvoice.notes,
      lines: deliveryLines.flatMap((deliveryLine) =>
        allocations
          .filter((allocation) => allocation.purchaseOrderItemId === deliveryLine.purchaseOrderItemId)
          .map((allocation) => ({
            purchaseOrderItemId: deliveryLine.purchaseOrderItemId,
            inboundDeliveryLineId: deliveryLine.id,
            inventoryItemId: allocation.inventoryItemId,
            uomId: allocation.uomId,
            receivedQty: deliveryLine.quantity,
            receivedPrimaryQty: deliveryLine.primaryUomQty,
          })),
      ),
    });
    await this.receiveLines(invoice, receipt.data.id, allocations, linesByAllocation, leCurrencyCode);
    return receipt.data.id;
  }

  // Loads what an invoice created: its invoice lines and the receipts they invoice, oldest first
  async findDocuments(supplierInvoiceId: string): Promise<ReceiveWithInvoiceDocuments> {
    const lines = await this.invoiceLinesService.findByInvoice(supplierInvoiceId);
    const receiptIds = _.uniq(lines.flatMap((line) => (line.goodsReceiptId ? [line.goodsReceiptId] : [])));
    const receipts: GoodsReceiptRow[] = [];
    for (const receiptId of receiptIds) receipts.push(await this.goodsReceiptsService.findDetailOrThrow(receiptId));
    return { lines, receipts };
  }

  // Removes what a draft invoice created, in the caller's transaction: its invoice lines (the invoice too unless it is
  // kept), its draft receipts and the deliveries created behind them
  async remove(
    invoice: SupplierInvoiceRow,
    documents: ReceiveWithInvoiceDocuments,
    keepInvoice: boolean,
  ): Promise<void> {
    this.assertReceiptsDraft(documents.receipts);
    if (keepInvoice) {
      for (const line of documents.lines) await this.invoiceLinesService.delete(invoice, line.id);
    } else {
      await this.invoicesService.delete(invoice);
    }
    for (const receipt of documents.receipts) {
      await this.goodsReceiptsService.delete(receipt);
      await this.deliveriesService.deleteForPurchase({
        id: receipt.inboundDeliveryId,
        deliveryNumber: receipt.deliveryNumber,
        source: receipt.deliverySource,
      });
    }
  }

  // Returns the PO line an allocation became; the invoice ordered every allocation it receives before it is read here
  private orderLineOf(allocation: AllocationWithLegRow): string {
    if (allocation.purchaseOrderItemId) return allocation.purchaseOrderItemId;
    throw new ConflictException({
      label: 'Not Ordered',
      detail: `"${allocation.inventoryItemName}" on "${allocation.purchaseNumber}" has no purchase order line to receive.`,
    });
  }

  // Puts each invoice line away on the allocation's receipt item, in a lot of its own when the item is lot-tracked, and
  // adds the invoice line invoicing it, in the caller's transaction
  private async receiveLines(
    invoice: InvoiceForLines,
    goodsReceiptId: string,
    allocations: AllocationWithLegRow[],
    linesByAllocation: Record<string, ReceiveWithInvoiceLinePlan[]>,
    leCurrencyCode: string,
  ): Promise<void> {
    const items = await this.goodsReceiptItemsService.findByReceiptId(goodsReceiptId);
    for (const allocation of allocations) {
      const item = items.find((receiptItem) => receiptItem.purchaseOrderItemId === allocation.purchaseOrderItemId);
      if (!item) continue;
      for (const planned of linesByAllocation[allocation.id]) {
        const context = await this.goodsReceiptItemsService.findDraftContextOrThrow(goodsReceiptId, item.id);
        const lotId = planned.lot
          ? (
              await this.lotsService.addLot(
                context,
                { goodsReceiptId, itemId: item.id, ...planned.lot },
                leCurrencyCode,
              )
            ).data.id
          : null;
        const quantities = this.primaryQuantitiesOf(allocation, planned.line);
        await this.receiptLinesService.addLine(
          context,
          {
            goodsReceiptId,
            itemId: item.id,
            goodsReceiptLotId: lotId,
            locationId: planned.locationId,
            quantity: new Decimal(planned.line.quantity).plus(planned.line.freeQty).toNumber(),
          },
          quantities.invoicedPrimaryQty.plus(quantities.freePrimaryQty).toNumber(),
        );
        const invoiceLine = await this.invoiceLinesService.prepare(
          invoice,
          {
            lineType: SupplierInvoiceLineTypeValues.ITEM,
            purchaseOrderItemId: item.purchaseOrderItemId,
            goodsReceiptItemId: item.id,
            goodsReceiptLotId: lotId,
            invoicedQty: planned.line.quantity,
            freeQty: planned.line.freeQty,
            unitPrice: planned.line.unitPrice,
            discountAmount: planned.line.discountAmount,
            taxAmount: planned.line.taxAmount,
          },
          { allowDraftReceipt: true },
        );
        await this.invoiceLinesService.create(invoice, invoiceLine);
      }
    }
  }

  // Sums what the invoice lines of one allocation receive (invoiced and free) in the allocation's unit
  private receivedQtyOf(lines: ReceiveWithInvoiceLinePlan[]): number {
    return lines
      .reduce((total, planned) => total.plus(planned.line.quantity).plus(planned.line.freeQty), new Decimal(0))
      .toNumber();
  }

  // Sums what the invoice lines of one allocation receive in primary units, each part rounded as its invoice line invoices it
  private receivedPrimaryQtyOf(allocation: AllocationWithLegRow, lines: ReceiveWithInvoiceLinePlan[]): number {
    return lines
      .reduce((total, planned) => {
        const quantities = this.primaryQuantitiesOf(allocation, planned.line);
        return total.plus(quantities.invoicedPrimaryQty).plus(quantities.freePrimaryQty);
      }, new Decimal(0))
      .toNumber();
  }

  // Converts an invoice line's invoiced and free quantities to primary units by its PO line's ratio, as its invoice line does
  private primaryQuantitiesOf(allocation: AllocationWithLegRow, line: ReceiveWithInvoiceLineDto): ReceivedQuantities {
    const primaryPerUnit = new Decimal(allocation.orderedPrimaryUomQty ?? allocation.primaryUomQty).dividedBy(
      allocation.orderedUomQty ?? allocation.uomQty,
    );
    return {
      invoicedPrimaryQty: primaryPerUnit.times(line.quantity).toDecimalPlaces(3, Decimal.ROUND_HALF_UP),
      freePrimaryQty: primaryPerUnit.times(line.freeQty).toDecimalPlaces(3, Decimal.ROUND_HALF_UP),
    };
  }

  // Rejects removing an invoice whose receipts are already posted
  private assertReceiptsDraft(receipts: GoodsReceiptRow[]): void {
    const posted = receipts.find((receipt) => receipt.status !== GoodsReceiptStatusValues.DRAFT);
    if (!posted) return;
    throw new ConflictException({
      label: 'Receipt Posted',
      detail: `Goods receipt "${posted.grNumber}" of this invoice is posted, so the invoice can no longer change.`,
    });
  }

  // Deletes a direct purchase leg's confirmed POs that no delivery, receipt or invoice line names any more, freeing their
  // allocations, in the caller's transaction
  async removeEmptyOrders(leg: Pick<PurchaseSupplier, 'type' | 'purchaseId' | 'supplierId'>): Promise<void> {
    if (leg.type !== PurchaseTypeValues.DIRECT_PURCHASE) return;
    const orders = (await this.purchaseOrdersService.findForPurchase(leg.purchaseId)).filter(
      (po) => po.supplierId === leg.supplierId && po.status === PurchaseOrderStatusValues.CONFIRMED,
    );
    if (orders.length === 0) return;
    const deliveries = await this.deliveriesService.findForPurchase(leg.purchaseId);
    const invoices = await this.invoicesService.findForPurchase(leg.purchaseId);
    for (const po of orders) {
      const isNamed =
        po.hasPostedGoodsReceipt ||
        deliveries.some((delivery) => delivery.poNumbers.includes(po.poNumber)) ||
        invoices.some((invoice) => invoice.poNumbers.includes(po.poNumber));
      if (isNamed) continue;
      const lines = await this.purchaseOrderItemsService.findRowsByPurchaseOrderIds([po.id]);
      await this.allocationsService.unlinkOrderLines(lines.map((line) => line.id));
      await this.purchaseOrdersService.deleteForPurchase(po);
    }
  }
}
