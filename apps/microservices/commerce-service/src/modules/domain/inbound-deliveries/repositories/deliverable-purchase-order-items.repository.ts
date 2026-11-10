import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, exists, inArray, notExists, sql } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { FindForSelectConfig, SelectQueryResult } from '@vritti/api-sdk/select';
import {
  type InboundDelivery,
  inboundDeliveries,
  inboundDeliveryLines,
  inventoryItems,
  type PurchaseOrder,
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
  supplierId: string;
  siteId: string;
  inventoryItemName: string;
  remainingQty: number;
  isOnDelivery: boolean;
};

export type OpenPurchaseOrderLine = {
  purchaseOrderItemId: string;
  purchaseOrderId: string;
  inventoryItemId: string;
  uomId: string;
  quantity: number;
};

export type DeliveryTarget = Pick<InboundDelivery, 'id' | 'deliveryNumber' | 'supplierId' | 'siteId'>;

@Injectable()
export class DeliverablePurchaseOrderItemsRepository extends PrimaryBaseRepository<typeof purchaseOrderItems> {
  private static readonly DELIVERABLE_STATUSES: PurchaseOrderStatus[] = [
    PurchaseOrderStatusValues.SENT,
    PurchaseOrderStatusValues.CONFIRMED,
    PurchaseOrderStatusValues.PARTIALLY_RECEIVED,
  ];

  constructor(database: PrimaryDatabaseService) {
    super(database, purchaseOrderItems);
  }

  // Returns the PO lines of the delivery's supplier at its site, on sent, confirmed or partially received orders, not yet on it and with quantity left to announce
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
        inArray(purchaseOrders.status, DeliverablePurchaseOrderItemsRepository.DELIVERABLE_STATUSES),
        notExists(onDelivery),
        sql`${remaining} > 0`,
      ],
      additionalExpressions: {
        purchaseOrderId: sql`${purchaseOrderItems.purchaseOrderId}`,
        poNumber: sql`${purchaseOrders.poNumber}`,
        poStatus: sql`${purchaseOrders.status}`,
        expectedDeliveryDate: sql`${purchaseOrderItems.expectedDeliveryDate}`,
        orderedQty: sql`${purchaseOrderItems.uomQty} + ${purchaseOrderItems.freeQty}`,
        receivedQty: sql`${purchaseOrderItems.receivedQuantity}`,
        deliverableQty: remaining,
        uomSymbol: sql`${uom.symbol}`,
        allowDecimal: sql`${uom.allowDecimal}`,
      },
    });
  }

  // Loads PO lines to put on a delivery, rejecting any that is missing, of another supplier or site, on an order not open for delivery, or already on it
  async findDeliverableOrThrow(
    delivery: DeliveryTarget,
    purchaseOrderItemIds: string[],
  ): Promise<DeliverablePurchaseOrderItem[]> {
    const onDelivery = this.db
      .select({ id: inboundDeliveryLines.id })
      .from(inboundDeliveryLines)
      .where(
        and(
          eq(inboundDeliveryLines.inboundDeliveryId, delivery.id),
          eq(inboundDeliveryLines.purchaseOrderItemId, purchaseOrderItems.id),
        ),
      );
    const rows = await this.db
      .select({
        id: purchaseOrderItems.id,
        purchaseOrderId: purchaseOrderItems.purchaseOrderId,
        poNumber: purchaseOrders.poNumber,
        poStatus: purchaseOrders.status,
        supplierId: purchaseOrders.supplierId,
        siteId: purchaseOrders.siteId,
        inventoryItemName: inventoryItems.name,
        remainingQty: sql<number>`${remainingToDeliver(this.db)}`.mapWith(Number),
        isOnDelivery: sql<boolean>`${exists(onDelivery)}`,
      })
      .from(purchaseOrderItems)
      .innerJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId))
      .innerJoin(inventoryItems, eq(inventoryItems.id, purchaseOrderItems.inventoryItemId))
      .where(inArray(purchaseOrderItems.id, purchaseOrderItemIds));

    if (rows.length < new Set(purchaseOrderItemIds).size) {
      throw new NotFoundException({
        label: 'Purchase Order Line Not Found',
        detail: 'One of the purchase order lines no longer exists or is out of reach.',
        errors: [{ field: 'lines', message: 'Unknown purchase order line' }],
      });
    }
    const otherSupplier = rows.find((row) => row.supplierId !== delivery.supplierId);
    if (otherSupplier) {
      throw new BadRequestException({
        label: 'Different Supplier',
        detail: `"${otherSupplier.poNumber}" is ordered from another supplier; an inbound delivery carries the orders of its own supplier.`,
        errors: [{ field: 'lines', message: 'Another supplier' }],
      });
    }
    const otherSite = rows.find((row) => row.siteId !== delivery.siteId);
    if (otherSite) {
      throw new BadRequestException({
        label: 'Different Site',
        detail: `"${otherSite.poNumber}" is for another site; an inbound delivery carries the orders of the site it arrives at.`,
        errors: [{ field: 'lines', message: 'Another site' }],
      });
    }
    const notOpen = rows.find(
      (row) => !DeliverablePurchaseOrderItemsRepository.DELIVERABLE_STATUSES.includes(row.poStatus),
    );
    if (notOpen) {
      throw new BadRequestException({
        label: 'Purchase Order Not Open',
        detail: `"${notOpen.poNumber}" is ${notOpen.poStatus}; only sent, confirmed or partially received orders can be delivered.`,
        errors: [{ field: 'lines', message: `Order is ${notOpen.poStatus}` }],
      });
    }
    const alreadyOn = rows.find((row) => row.isOnDelivery);
    if (alreadyOn) {
      throw new ConflictException({
        label: 'Already on Delivery',
        detail: `"${alreadyOn.inventoryItemName}" of "${alreadyOn.poNumber}" is already on "${delivery.deliveryNumber}". Change that line's quantity instead.`,
        errors: [{ field: 'lines', message: 'Already on this delivery' }],
      });
    }
    return rows;
  }

  // Returns every line of the POs with quantity left outside their receipts and open deliveries, at that quantity, throwing when a PO has none
  async findOpenOnPurchaseOrdersOrThrow(
    orders: Pick<PurchaseOrder, 'id' | 'poNumber'>[],
    field = 'purchaseOrderIds',
  ): Promise<OpenPurchaseOrderLine[]> {
    const remaining = remainingToDeliver(this.db);
    const rows = await this.db
      .select({
        purchaseOrderItemId: purchaseOrderItems.id,
        purchaseOrderId: purchaseOrderItems.purchaseOrderId,
        inventoryItemId: purchaseOrderItems.inventoryItemId,
        uomId: purchaseOrderItems.uomId,
        quantity: sql<number>`${remaining}`.mapWith(Number),
      })
      .from(purchaseOrderItems)
      .innerJoin(inventoryItems, eq(inventoryItems.id, purchaseOrderItems.inventoryItemId))
      .where(
        and(
          inArray(
            purchaseOrderItems.purchaseOrderId,
            orders.map((po) => po.id),
          ),
          sql`${remaining} > 0`,
        ),
      )
      .orderBy(asc(purchaseOrderItems.purchaseOrderId), asc(inventoryItems.name));

    const exhausted = orders.find((po) => !rows.some((row) => row.purchaseOrderId === po.id));
    if (!exhausted) return rows;
    throw new BadRequestException({
      label: 'Nothing Left to Receive',
      detail: `Every line of "${exhausted.poNumber}" is received or already on an open inbound delivery. Receive that delivery instead.`,
      errors: [{ field, message: 'Nothing left to receive' }],
    });
  }

  // Rejects announcing more of a PO line than it has left after its receipts and its other live deliveries
  assertWithinRemaining(items: DeliverablePurchaseOrderItem[], quantityById: Map<string, number>): void {
    const over = items.find((item) => (quantityById.get(item.id) ?? 0) > item.remainingQty);
    if (!over) return;
    throw new BadRequestException({
      label: 'More Than Open on Order',
      detail:
        over.remainingQty > 0
          ? `"${over.poNumber}" has only ${over.remainingQty} of "${over.inventoryItemName}" left to deliver after its receipts and other deliveries.`
          : `Nothing of "${over.inventoryItemName}" on "${over.poNumber}" is left to deliver after its receipts and other deliveries.`,
      errors: [{ field: 'lines', message: `At most ${Math.max(over.remainingQty, 0)}` }],
    });
  }
}
