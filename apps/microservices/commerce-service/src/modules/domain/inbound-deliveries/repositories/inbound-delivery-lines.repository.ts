import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, getColumns, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import {
  type InboundDeliveryLine,
  inboundDeliveryLines,
  inventoryItems,
  type NewInboundDeliveryLine,
  type PurchaseOrderStatus,
  PurchaseOrderStatusValues,
  purchaseOrderItems,
  purchaseOrders,
  uom,
} from '@/db/schema';
import { receivedAgainstDelivery, remainingToDeliver } from './delivery-quantities';

export type InboundDeliveryLineRow = InboundDeliveryLine & {
  purchaseOrderId: string;
  poNumber: string;
  poStatus: PurchaseOrderStatus;
  inventoryItemId: string;
  inventoryItemName: string | null;
  uomId: string;
  uomSymbol: string | null;
  allowDecimal: boolean;
  orderedQty: number;
  poReceivedQty: number;
  receivedOnDeliveryQty: number;
  openQty: number;
  maxQuantity: number;
};

export type ReceivableDeliveryLine = Pick<InboundDeliveryLine, 'purchaseOrderItemId'> & {
  inventoryItemId: string;
  uomId: string;
  receivedQty: number;
};

@Injectable()
export class InboundDeliveryLinesDomainRepository extends PrimaryBaseRepository<typeof inboundDeliveryLines> {
  private static readonly RECEIVABLE_STATUSES: PurchaseOrderStatus[] = [
    PurchaseOrderStatusValues.CONFIRMED,
    PurchaseOrderStatusValues.PARTIALLY_RECEIVED,
  ];

  constructor(database: PrimaryDatabaseService) {
    super(database, inboundDeliveryLines);
  }

  // Returns one page of a delivery's lines with their PO line, quantities and what is received against the delivery
  async findForTable(
    inboundDeliveryId: string,
    options: { where?: SQL; orderBy: SQL[]; limit: number; offset: number },
  ): Promise<{ result: InboundDeliveryLineRow[]; count: number }> {
    return this.findAllAndCount<InboundDeliveryLineRow>({
      select: this.selection(),
      innerJoins: this.joins(),
      ...options,
      where: and(eq(inboundDeliveryLines.inboundDeliveryId, inboundDeliveryId), options.where),
    });
  }

  // Loads a line of the given delivery with its quantities, throwing when it is not on it
  async findOnDeliveryOrThrow(inboundDeliveryId: string, lineId: string): Promise<InboundDeliveryLineRow> {
    const row = await this.findById<InboundDeliveryLineRow>(lineId, {
      select: this.selection(),
      innerJoins: this.joins(),
      where: eq(inboundDeliveryLines.inboundDeliveryId, inboundDeliveryId),
    });
    if (!row) throw new NotFoundException('Inbound delivery line not found.');
    return row;
  }

  // Returns the PO lines a delivery holds
  async findPurchaseOrderItemIds(inboundDeliveryId: string): Promise<string[]> {
    const rows = await this.findMany({ where: { inboundDeliveryId } });
    return rows.map((row) => row.purchaseOrderItemId);
  }

  // Returns each line of a receivable order still open against the delivery, at what is left of it on the delivery and on its PO line, throwing when none is
  async findReceivableOrThrow(delivery: { id: string; deliveryNumber: string }): Promise<ReceivableDeliveryLine[]> {
    const received = receivedAgainstDelivery(
      this.db,
      inboundDeliveryLines.inboundDeliveryId,
      inboundDeliveryLines.purchaseOrderItemId,
    );
    const receivable = sql`least(
      ${inboundDeliveryLines.quantity} - ${received},
      ${purchaseOrderItems.uomQty} + ${purchaseOrderItems.freeQty} - ${purchaseOrderItems.receivedQuantity}
    )`;
    const rows = await this.db
      .select({
        purchaseOrderItemId: inboundDeliveryLines.purchaseOrderItemId,
        inventoryItemId: purchaseOrderItems.inventoryItemId,
        uomId: purchaseOrderItems.uomId,
        receivedQty: sql<number>`${receivable}`.mapWith(Number),
      })
      .from(inboundDeliveryLines)
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, inboundDeliveryLines.purchaseOrderItemId))
      .innerJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId))
      .innerJoin(inventoryItems, eq(inventoryItems.id, purchaseOrderItems.inventoryItemId))
      .where(
        and(
          eq(inboundDeliveryLines.inboundDeliveryId, delivery.id),
          inArray(purchaseOrders.status, InboundDeliveryLinesDomainRepository.RECEIVABLE_STATUSES),
          sql`${receivable} > 0`,
        ),
      )
      .orderBy(asc(purchaseOrders.poNumber), asc(inventoryItems.name));
    if (rows.length > 0) return rows;
    throw new BadRequestException({
      label: 'Nothing Left to Receive',
      detail: `No line of "${delivery.deliveryNumber}" has quantity left to receive on a confirmed or partially received order.`,
    });
  }

  // Inserts the given lines in one statement
  async insertMany(rows: NewInboundDeliveryLine[]): Promise<void> {
    await this.db.insert(inboundDeliveryLines).values(rows);
  }

  // Sets the quantity of the delivery's line of a PO line
  async setQuantityOfPurchaseOrderItem(
    inboundDeliveryId: string,
    purchaseOrderItemId: string,
    quantity: number,
  ): Promise<void> {
    await this.updateMany(this.lineOfPurchaseOrderItem(inboundDeliveryId, purchaseOrderItemId), { quantity });
  }

  // Deletes the delivery's line of a PO line
  async deleteOfPurchaseOrderItem(inboundDeliveryId: string, purchaseOrderItemId: string): Promise<void> {
    await this.deleteMany(this.lineOfPurchaseOrderItem(inboundDeliveryId, purchaseOrderItemId));
  }

  // Rejects a line quantity below what is already received against the delivery, or raised past what the PO line has left to deliver
  assertQuantityChange(line: InboundDeliveryLineRow, quantity: number): void {
    if (quantity < line.receivedOnDeliveryQty) {
      throw new BadRequestException({
        label: 'Below Received Quantity',
        detail: `${line.receivedOnDeliveryQty} of "${line.inventoryItemName ?? 'this item'}" are already received against this delivery, so the line cannot go below that.`,
        errors: [{ field: 'quantity', message: `At least ${line.receivedOnDeliveryQty}` }],
      });
    }
    if (quantity <= line.quantity || quantity <= line.maxQuantity) return;
    throw new BadRequestException({
      label: 'More Than Open on Order',
      detail: `"${line.poNumber}" has only ${line.maxQuantity} of "${line.inventoryItemName ?? 'this item'}" left to deliver after its receipts and other deliveries.`,
      errors: [{ field: 'quantity', message: `At most ${line.maxQuantity}` }],
    });
  }

  // Rejects removing a line that goods have already been received against
  assertRemovable(line: InboundDeliveryLineRow): void {
    if (line.receivedOnDeliveryQty <= 0) return;
    throw new BadRequestException({
      label: 'Cannot Remove Line',
      detail: `Goods of "${line.inventoryItemName ?? 'this item'}" are already received against this delivery. Reduce the line to the received quantity instead.`,
    });
  }

  // Selects a line with its PO line and unit, ordered and received quantities, what is received against the delivery and how far it may be raised
  private selection() {
    const received = receivedAgainstDelivery(
      this.db,
      inboundDeliveryLines.inboundDeliveryId,
      inboundDeliveryLines.purchaseOrderItemId,
    );
    return {
      ...getColumns(inboundDeliveryLines),
      purchaseOrderId: purchaseOrderItems.purchaseOrderId,
      poNumber: purchaseOrders.poNumber,
      poStatus: purchaseOrders.status,
      inventoryItemId: purchaseOrderItems.inventoryItemId,
      inventoryItemName: inventoryItems.name,
      uomId: purchaseOrderItems.uomId,
      uomSymbol: uom.symbol,
      allowDecimal: uom.allowDecimal,
      orderedQty: sql<number>`${purchaseOrderItems.uomQty} + ${purchaseOrderItems.freeQty}`.mapWith(Number),
      poReceivedQty: purchaseOrderItems.receivedQuantity,
      receivedOnDeliveryQty: sql<number>`${received}`.mapWith(Number),
      openQty: sql<number>`greatest(${inboundDeliveryLines.quantity} - ${received}, 0)`.mapWith(Number),
      maxQuantity:
        sql<number>`greatest(${inboundDeliveryLines.quantity}, ${received}) + ${remainingToDeliver(this.db)}`.mapWith(
          Number,
        ),
    };
  }

  // Matches the delivery's line of a PO line
  private lineOfPurchaseOrderItem(inboundDeliveryId: string, purchaseOrderItemId: string): SQL {
    return and(
      eq(inboundDeliveryLines.inboundDeliveryId, inboundDeliveryId),
      eq(inboundDeliveryLines.purchaseOrderItemId, purchaseOrderItemId),
    ) as SQL;
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
