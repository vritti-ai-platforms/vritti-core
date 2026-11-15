import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, exists, inArray, ne, notExists, sql } from '@vritti/api-sdk/drizzle-orm';
import type { FindForSelectConfig, SelectQueryResult } from '@vritti/api-sdk/select';
import {
  inboundDeliveries,
  inboundDeliveryLines,
  inventoryItems,
  type PurchaseOrderReceiptStatus,
  PurchaseOrderReceiptStatusValues,
  type PurchaseOrderStatus,
  PurchaseOrderStatusValues,
  purchaseOrderItems,
  purchaseOrders,
  uom,
} from '@/db/schema';
import { remainingToDeliver } from './delivery-quantities';

export type DeliverablePurchaseOrderItem = {
  id: string;
  purchaseOrderId: string;
  poNumber: string;
  poStatus: PurchaseOrderStatus;
  poReceiptStatus: PurchaseOrderReceiptStatus;
  supplierId: string;
  siteId: string;
  inventoryItemName: string;
  uomQty: number;
  primaryUomQty: number;
  remainingPrimaryQty: number;
  isOnDelivery: boolean;
};

@Injectable()
export class DeliverablePurchaseOrderItemsRepository extends PrimaryBaseRepository<typeof purchaseOrderItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, purchaseOrderItems);
  }

  // Returns the PO lines of the delivery's supplier at its site, on confirmed orders not fully received, not yet on it and with primary quantity left to put on an inbound delivery
  findForSelectDeliverable(inboundDeliveryId: string, config: FindForSelectConfig): Promise<SelectQueryResult> {
    const delivery = (column: typeof inboundDeliveries.siteId | typeof inboundDeliveries.supplierId) =>
      this.db.select({ value: column }).from(inboundDeliveries).where(eq(inboundDeliveries.id, inboundDeliveryId));
    const onDelivery = this.db
      .select({ id: inboundDeliveryLines.id })
      .from(inboundDeliveryLines)
      .where(
        and(
          eq(inboundDeliveryLines.inboundDeliveryId, inboundDeliveryId),
          eq(inboundDeliveryLines.purchaseOrderItemId, purchaseOrderItems.id),
        ),
      );
    const remaining = remainingToDeliver(this.db);

    return super.findForSelect({
      ...config,
      joins: [
        { table: inventoryItems, on: eq(inventoryItems.id, purchaseOrderItems.inventoryItemId), type: 'inner' },
        { table: purchaseOrders, on: eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId), type: 'inner' },
        { table: uom, on: eq(uom.id, purchaseOrderItems.uomId), type: 'left' },
      ],
      conditions: [
        sql`${purchaseOrders.siteId} = (${delivery(inboundDeliveries.siteId)})`,
        sql`${purchaseOrders.supplierId} = (${delivery(inboundDeliveries.supplierId)})`,
        eq(purchaseOrders.status, PurchaseOrderStatusValues.CONFIRMED),
        ne(purchaseOrders.receiptStatus, PurchaseOrderReceiptStatusValues.RECEIVED),
        notExists(onDelivery),
        sql`${remaining} > 0`,
      ],
      additionalExpressions: {
        purchaseOrderId: sql`${purchaseOrderItems.purchaseOrderId}`,
        poNumber: sql`${purchaseOrders.poNumber}`,
        poStatus: sql`${purchaseOrders.status}`,
        poReceiptStatus: sql`${purchaseOrders.receiptStatus}`,
        expectedDeliveryDate: sql`${purchaseOrderItems.expectedDeliveryDate}`,
        uomQty: sql`${purchaseOrderItems.uomQty}`,
        primaryUomQty: sql`${purchaseOrderItems.primaryUomQty}`,
        freePrimaryQty: sql`${purchaseOrderItems.freePrimaryQty}`,
        receivedPrimaryQty: sql`${purchaseOrderItems.receivedPrimaryQty}`,
        deliverablePrimaryQty: remaining,
        uomSymbol: sql`${uom.symbol}`,
        allowDecimal: sql`${uom.allowDecimal}`,
      },
    });
  }

  // Returns what each of the given PO lines still has free to put on an inbound delivery or receive, in primary units
  async findRemainingToDeliver(purchaseOrderItemIds: string[]): Promise<{ id: string; remainingPrimaryQty: number }[]> {
    if (purchaseOrderItemIds.length === 0) return [];
    return this.db
      .select({
        id: purchaseOrderItems.id,
        remainingPrimaryQty: sql<number>`${remainingToDeliver(this.db)}`.mapWith(Number),
      })
      .from(purchaseOrderItems)
      .where(inArray(purchaseOrderItems.id, purchaseOrderItemIds));
  }

  // Loads the given PO lines with their order, what is left to deliver of them and whether they are already on the delivery
  findForDelivery(inboundDeliveryId: string, purchaseOrderItemIds: string[]): Promise<DeliverablePurchaseOrderItem[]> {
    const onDelivery = this.db
      .select({ id: inboundDeliveryLines.id })
      .from(inboundDeliveryLines)
      .where(
        and(
          eq(inboundDeliveryLines.inboundDeliveryId, inboundDeliveryId),
          eq(inboundDeliveryLines.purchaseOrderItemId, purchaseOrderItems.id),
        ),
      );
    return this.db
      .select({
        id: purchaseOrderItems.id,
        purchaseOrderId: purchaseOrderItems.purchaseOrderId,
        poNumber: purchaseOrders.poNumber,
        poStatus: purchaseOrders.status,
        poReceiptStatus: purchaseOrders.receiptStatus,
        supplierId: purchaseOrders.supplierId,
        siteId: purchaseOrders.siteId,
        inventoryItemName: inventoryItems.name,
        uomQty: purchaseOrderItems.uomQty,
        primaryUomQty: purchaseOrderItems.primaryUomQty,
        remainingPrimaryQty: sql<number>`${remainingToDeliver(this.db)}`.mapWith(Number),
        isOnDelivery: sql<boolean>`${exists(onDelivery)}`,
      })
      .from(purchaseOrderItems)
      .innerJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId))
      .innerJoin(inventoryItems, eq(inventoryItems.id, purchaseOrderItems.inventoryItemId))
      .where(inArray(purchaseOrderItems.id, purchaseOrderItemIds));
  }
}
