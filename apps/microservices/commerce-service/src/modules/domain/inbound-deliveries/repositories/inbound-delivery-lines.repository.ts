import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, getColumns, inArray, notInArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type DisplayUnitRatios,
  displayUnitRatios,
  goodsReceiptItems,
  type InboundDeliveryLine,
  InboundDeliverySourceValues,
  InboundDeliveryStatusValues,
  inboundDeliveries,
  inboundDeliveryLines,
  inventoryItems,
  type NewInboundDeliveryLine,
  type PurchaseOrderReceiptStatus,
  type PurchaseOrderStatus,
  PurchaseOrderStatusValues,
  purchaseOrderItems,
  purchaseOrders,
  uom,
} from '@/db/schema';
import { acceptedOnDeliveryLine, remainingToDeliver } from './delivery-quantities';

export type InboundDeliveryLineRow = InboundDeliveryLine & {
  purchaseOrderId: string;
  poNumber: string;
  poStatus: PurchaseOrderStatus;
  poReceiptStatus: PurchaseOrderReceiptStatus;
  inventoryItemId: string;
  inventoryItemName: string | null;
  uomId: string;
  uomSymbol: string;
  allowDecimal: boolean;
  poUomQty: number;
  poPrimaryUomQty: number;
  poFreePrimaryQty: number;
  poCancelledPrimaryQty: number;
  poReceivedPrimaryQty: number;
  acceptedOnDeliveryPrimaryQty: number;
  remainingToDeliverPrimaryQty: number;
  goodsReceiptItemCount: number;
};

export type InboundDeliveryLineTableRow = InboundDeliveryLineRow & { displayUnitRatios: DisplayUnitRatios };

export type DeliveryLineReceivability = Pick<InboundDeliveryLine, 'id' | 'purchaseOrderItemId' | 'primaryUomQty'> & {
  inventoryItemId: string;
  uomId: string;
  poUomQty: number;
  poPrimaryUomQty: number;
  poFreePrimaryQty: number;
  poCancelledPrimaryQty: number;
  poReceivedPrimaryQty: number;
  acceptedOnDeliveryPrimaryQty: number;
};

@Injectable()
export class InboundDeliveryLinesDomainRepository extends PrimaryBaseRepository<typeof inboundDeliveryLines> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inboundDeliveryLines);
  }

  // Returns one page of a delivery's lines with their PO line, quantities, what is received against the delivery and
  // what turns each line's item into its display unit
  async findForTable(
    inboundDeliveryId: string,
    options: { where?: SQL; orderBy: SQL[]; limit: number; offset: number },
  ): Promise<{ result: InboundDeliveryLineTableRow[]; count: number }> {
    return this.findAllAndCount<InboundDeliveryLineTableRow>({
      select: { ...this.selection(), displayUnitRatios: displayUnitRatios() },
      innerJoins: this.joins(),
      ...options,
      where: and(eq(inboundDeliveryLines.inboundDeliveryId, inboundDeliveryId), options.where),
    });
  }

  // Loads a line of the given delivery with its quantities
  findOnDelivery(inboundDeliveryId: string, lineId: string): Promise<InboundDeliveryLineRow | undefined> {
    return this.findById<InboundDeliveryLineRow>(lineId, {
      select: this.selection(),
      innerJoins: this.joins(),
      where: eq(inboundDeliveryLines.inboundDeliveryId, inboundDeliveryId),
    });
  }

  // Returns each line of the delivery on a confirmed order with what is accepted against it and its PO line's counters
  async findOnConfirmedOrders(inboundDeliveryId: string): Promise<DeliveryLineReceivability[]> {
    return this.db
      .select({
        id: inboundDeliveryLines.id,
        purchaseOrderItemId: inboundDeliveryLines.purchaseOrderItemId,
        primaryUomQty: inboundDeliveryLines.primaryUomQty,
        inventoryItemId: purchaseOrderItems.inventoryItemId,
        uomId: purchaseOrderItems.uomId,
        poUomQty: purchaseOrderItems.uomQty,
        poPrimaryUomQty: purchaseOrderItems.primaryUomQty,
        poFreePrimaryQty: purchaseOrderItems.freePrimaryQty,
        poCancelledPrimaryQty: purchaseOrderItems.cancelledPrimaryQty,
        poReceivedPrimaryQty: purchaseOrderItems.receivedPrimaryQty,
        acceptedOnDeliveryPrimaryQty: sql<number>`${acceptedOnDeliveryLine(this.db, inboundDeliveryLines.id)}`.mapWith(
          Number,
        ),
      })
      .from(inboundDeliveryLines)
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, inboundDeliveryLines.purchaseOrderItemId))
      .innerJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId))
      .innerJoin(inventoryItems, eq(inventoryItems.id, purchaseOrderItems.inventoryItemId))
      .where(
        and(
          eq(inboundDeliveryLines.inboundDeliveryId, inboundDeliveryId),
          eq(purchaseOrders.status, PurchaseOrderStatusValues.CONFIRMED),
        ),
      )
      .orderBy(asc(purchaseOrders.poNumber), asc(inventoryItems.name));
  }

  // Sums, per PO line, what deliveries created behind invoices and not yet received carry, leaving out the given deliveries
  findPendingOnSupplierInvoices(
    purchaseOrderItemIds: string[],
    excludeDeliveryIds: string[],
  ): Promise<{ purchaseOrderItemId: string; primaryUomQty: number }[]> {
    return this.db
      .select({
        purchaseOrderItemId: inboundDeliveryLines.purchaseOrderItemId,
        primaryUomQty: sql<number>`coalesce(sum(${inboundDeliveryLines.primaryUomQty}), 0)`.mapWith(Number),
      })
      .from(inboundDeliveryLines)
      .innerJoin(inboundDeliveries, eq(inboundDeliveries.id, inboundDeliveryLines.inboundDeliveryId))
      .where(
        and(
          inArray(inboundDeliveryLines.purchaseOrderItemId, purchaseOrderItemIds),
          eq(inboundDeliveries.source, InboundDeliverySourceValues.SUPPLIER_INVOICE),
          notInArray(inboundDeliveries.status, [
            InboundDeliveryStatusValues.RECEIVED,
            InboundDeliveryStatusValues.CANCELLED,
          ]),
          excludeDeliveryIds.length > 0 ? notInArray(inboundDeliveries.id, excludeDeliveryIds) : undefined,
        ),
      )
      .groupBy(inboundDeliveryLines.purchaseOrderItemId);
  }

  // Inserts the given lines in one statement and returns them
  insertMany(rows: NewInboundDeliveryLine[]): Promise<InboundDeliveryLine[]> {
    return this.db.insert(inboundDeliveryLines).values(rows).returning();
  }

  // Selects a line with its PO line and unit, the PO line's primary counters, what is accepted against the delivery, what the PO line has left to put on an inbound delivery and how many receipt items count it
  private selection() {
    return {
      ...getColumns(inboundDeliveryLines),
      purchaseOrderId: purchaseOrderItems.purchaseOrderId,
      poNumber: purchaseOrders.poNumber,
      poStatus: purchaseOrders.status,
      poReceiptStatus: purchaseOrders.receiptStatus,
      inventoryItemId: purchaseOrderItems.inventoryItemId,
      inventoryItemName: inventoryItems.name,
      uomId: purchaseOrderItems.uomId,
      uomSymbol: uom.symbol,
      allowDecimal: uom.allowDecimal,
      poUomQty: purchaseOrderItems.uomQty,
      poPrimaryUomQty: purchaseOrderItems.primaryUomQty,
      poFreePrimaryQty: purchaseOrderItems.freePrimaryQty,
      poCancelledPrimaryQty: purchaseOrderItems.cancelledPrimaryQty,
      poReceivedPrimaryQty: purchaseOrderItems.receivedPrimaryQty,
      acceptedOnDeliveryPrimaryQty: sql<number>`${acceptedOnDeliveryLine(this.db, inboundDeliveryLines.id)}`.mapWith(
        Number,
      ),
      remainingToDeliverPrimaryQty: sql<number>`${remainingToDeliver(this.db)}`.mapWith(Number),
      goodsReceiptItemCount: this.db.$count(
        goodsReceiptItems,
        eq(goodsReceiptItems.inboundDeliveryLineId, inboundDeliveryLines.id),
      ),
    };
  }

  // Joins the PO line with its order, the ordered item and its unit
  private joins() {
    return [
      { table: purchaseOrderItems, on: eq(purchaseOrderItems.id, inboundDeliveryLines.purchaseOrderItemId) },
      { table: purchaseOrders, on: eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId) },
      { table: inventoryItems, on: eq(inventoryItems.id, purchaseOrderItems.inventoryItemId) },
      { table: uom, on: eq(uom.id, purchaseOrderItems.uomId) },
    ];
  }
}
