import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import {
  and,
  asc,
  eq,
  exists,
  getColumns,
  inArray,
  ne,
  notExists,
  notInArray,
  type SQL,
  sql,
} from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { FindForSelectConfig, SelectQueryResult } from '@vritti/api-sdk/select';
import {
  GoodsReceiptStatusValues,
  goodsReceipts,
  type InboundDelivery,
  type InboundDeliverySource,
  InboundDeliverySourceValues,
  type InboundDeliveryStatus,
  InboundDeliveryStatusValues,
  inboundDeliveries,
  inboundDeliveryLines,
  inboundDeliveryNumberSeq,
  parties,
  purchaseOrderItems,
  purchaseOrders,
  suppliers,
} from '@/db/schema';
import { receivedAgainstDelivery } from './delivery-quantities';

export type ReceiptDeliveryDraft = Pick<
  InboundDelivery,
  | 'legalEntityId'
  | 'siteId'
  | 'supplierId'
  | 'deliveryNumber'
  | 'carrier'
  | 'trackingNumber'
  | 'supplierDeliveryNoteNumber'
  | 'supplierDeliveryNoteDate'
  | 'notes'
>;

export type InboundDeliveryNote = Pick<InboundDelivery, 'supplierDeliveryNoteNumber' | 'supplierDeliveryNoteDate'>;

export type InboundDeliveryRow = InboundDelivery & {
  supplierName: string | null;
  lineCount: number;
  poNumbers: string[];
  goodsReceiptCount: number;
  draftGoodsReceiptId: string | null;
  sourceGoodsReceiptId: string | null;
  sourceGrNumber: string | null;
  isEditable: boolean;
  canCancel: boolean;
  canDelete: boolean;
  canReceive: boolean;
};

@Injectable()
export class InboundDeliveriesDomainRepository extends PrimaryBaseRepository<typeof inboundDeliveries> {
  private static readonly LOCKED_STATUSES: InboundDeliveryStatus[] = [
    InboundDeliveryStatusValues.RECEIVED,
    InboundDeliveryStatusValues.CANCELLED,
  ];
  private static readonly CANCELLABLE_STATUSES: InboundDeliveryStatus[] = [
    InboundDeliveryStatusValues.PLANNED,
    InboundDeliveryStatusValues.IN_TRANSIT,
    InboundDeliveryStatusValues.ARRIVED,
  ];
  private static readonly STATUS_TRANSITIONS: Record<InboundDeliveryStatus, InboundDeliveryStatus[]> = {
    [InboundDeliveryStatusValues.PLANNED]: [
      InboundDeliveryStatusValues.IN_TRANSIT,
      InboundDeliveryStatusValues.ARRIVED,
      InboundDeliveryStatusValues.CANCELLED,
    ],
    [InboundDeliveryStatusValues.IN_TRANSIT]: [
      InboundDeliveryStatusValues.ARRIVED,
      InboundDeliveryStatusValues.CANCELLED,
    ],
    [InboundDeliveryStatusValues.ARRIVED]: [InboundDeliveryStatusValues.CANCELLED],
    [InboundDeliveryStatusValues.PARTIALLY_RECEIVED]: [],
    [InboundDeliveryStatusValues.RECEIVED]: [],
    [InboundDeliveryStatusValues.CANCELLED]: [],
  };

  constructor(database: PrimaryDatabaseService) {
    super(database, inboundDeliveries, { sequence: inboundDeliveryNumberSeq });
  }

  // Generates the next sequential delivery number for the current month
  async generateDeliveryNumber(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextNumber = await this.nextSequenceValue();
    return `IBD-${yearMonth}-${String(nextNumber).padStart(4, '0')}`;
  }

  // Loads a delivery with its supplier, lines, purchase orders, receipts and what may still happen to it, throwing when it is out of reach
  async findDetailOrThrow(id: string): Promise<InboundDeliveryRow> {
    const row = await this.findById<InboundDeliveryRow>(id, { select: this.selection(), leftJoins: this.joins() });
    if (!row) throw new NotFoundException('Inbound delivery not found.');
    return row;
  }

  // Returns one page of deliveries with their supplier, lines, purchase orders, receipts and what may still happen to them
  async findForTable(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: InboundDeliveryRow[]; count: number }> {
    return this.findAllAndCount<InboundDeliveryRow>({ select: this.selection(), leftJoins: this.joins(), ...options });
  }

  // Matches deliveries carrying a line of the purchase order
  carriesPurchaseOrder(purchaseOrderId: string): SQL {
    return exists(
      this.db
        .select({ id: inboundDeliveryLines.id })
        .from(inboundDeliveryLines)
        .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, inboundDeliveryLines.purchaseOrderItemId))
        .where(
          and(
            eq(inboundDeliveryLines.inboundDeliveryId, inboundDeliveries.id),
            eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId),
          ),
        ),
    );
  }

  // Moves a delivery a published receipt counts to received once every line is fully accepted against it, else to partially received; a delivery its receipt created is received with that receipt
  async syncReceiptStatus(id: string): Promise<Pick<InboundDelivery, 'deliveryNumber' | 'status'> | undefined> {
    const ownLines = eq(inboundDeliveryLines.inboundDeliveryId, inboundDeliveries.id);
    const shortLine = this.db
      .select({ id: inboundDeliveryLines.id })
      .from(inboundDeliveryLines)
      .where(
        and(
          ownLines,
          sql`${receivedAgainstDelivery(this.db, inboundDeliveryLines.inboundDeliveryId, inboundDeliveryLines.purchaseOrderItemId)} < ${inboundDeliveryLines.quantity}`,
        ),
      );
    const publishedReceipt = this.db
      .select({ id: goodsReceipts.id })
      .from(goodsReceipts)
      .where(
        and(
          eq(goodsReceipts.inboundDeliveryId, inboundDeliveries.id),
          eq(goodsReceipts.status, GoodsReceiptStatusValues.PUBLISHED),
        ),
      );
    const nextStatus = sql`case
      when ${exists(publishedReceipt)} and ${eq(inboundDeliveries.source, InboundDeliverySourceValues.RECEIPT)} then ${InboundDeliveryStatusValues.RECEIVED}
      when ${exists(publishedReceipt)} and ${notExists(shortLine)} then ${InboundDeliveryStatusValues.RECEIVED}
      when ${exists(publishedReceipt)} then ${InboundDeliveryStatusValues.PARTIALLY_RECEIVED}
      else ${inboundDeliveries.status}
    end`;

    const [moved] = await this.db
      .update(inboundDeliveries)
      .set({ status: nextStatus })
      .where(
        and(
          eq(inboundDeliveries.id, id),
          ne(inboundDeliveries.status, InboundDeliveryStatusValues.CANCELLED),
          sql`${inboundDeliveries.status} <> ${nextStatus}`,
        ),
      )
      .returning({ deliveryNumber: inboundDeliveries.deliveryNumber, status: inboundDeliveries.status });
    return moved;
  }

  // Inserts the arrived delivery a goods receipt without an announced delivery creates, expected on the day it was received in the site's timezone
  async createFromReceipt(
    draft: ReceiptDeliveryDraft,
    receivedDate: string,
    timezone: string,
  ): Promise<InboundDelivery> {
    const [created] = await this.db
      .insert(inboundDeliveries)
      .values({
        ...draft,
        source: InboundDeliverySourceValues.RECEIPT,
        status: InboundDeliveryStatusValues.ARRIVED,
        expectedDeliveryDate: sql`(${receivedDate}::timestamptz at time zone ${timezone})::date`,
      })
      .returning();
    return created;
  }

  // Returns the site's announced deliveries still open, without a draft receipt and with something left to receive, for a goods receipt's delivery picker
  findForSelectReceivable(config: FindForSelectConfig): Promise<SelectQueryResult> {
    const ownLines = eq(inboundDeliveryLines.inboundDeliveryId, inboundDeliveries.id);
    const openLine = this.db
      .select({ id: inboundDeliveryLines.id })
      .from(inboundDeliveryLines)
      .where(
        and(
          ownLines,
          sql`${receivedAgainstDelivery(this.db, inboundDeliveryLines.inboundDeliveryId, inboundDeliveryLines.purchaseOrderItemId)} < ${inboundDeliveryLines.quantity}`,
        ),
      );
    const draftReceipt = this.db
      .select({ id: goodsReceipts.id })
      .from(goodsReceipts)
      .where(
        and(
          eq(goodsReceipts.inboundDeliveryId, inboundDeliveries.id),
          eq(goodsReceipts.status, GoodsReceiptStatusValues.DRAFT),
        ),
      );

    return super.findForSelect({
      ...config,
      joins: [
        { table: suppliers, on: eq(suppliers.id, inboundDeliveries.supplierId), type: 'inner' },
        { table: parties, on: eq(parties.id, suppliers.partyId), type: 'inner' },
      ],
      conditions: [
        eq(inboundDeliveries.source, InboundDeliverySourceValues.ANNOUNCED),
        notInArray(inboundDeliveries.status, InboundDeliveriesDomainRepository.LOCKED_STATUSES),
        notExists(draftReceipt),
        exists(openLine),
      ],
      additionalExpressions: {
        supplierId: sql`${inboundDeliveries.supplierId}`,
        supplierName: sql`${parties.displayName}`,
        expectedDeliveryDate: sql`${inboundDeliveries.expectedDeliveryDate}`,
      },
    });
  }

  // Rejects a supplier delivery note number already on another non-cancelled delivery of the supplier, compared case-insensitively
  async assertDeliveryNoteAvailable(
    supplierId: string,
    noteNumber: string | null | undefined,
    excludeDeliveryId?: string,
  ): Promise<void> {
    if (!noteNumber) return;
    const [taken] = await this.db
      .select({ deliveryNumber: inboundDeliveries.deliveryNumber })
      .from(inboundDeliveries)
      .where(
        and(
          eq(inboundDeliveries.supplierId, supplierId),
          sql`lower(${inboundDeliveries.supplierDeliveryNoteNumber}) = lower(${noteNumber})`,
          ne(inboundDeliveries.status, InboundDeliveryStatusValues.CANCELLED),
          excludeDeliveryId ? ne(inboundDeliveries.id, excludeDeliveryId) : undefined,
        ),
      )
      .limit(1);
    if (!taken) return;
    throw new ConflictException({
      label: 'Delivery Note Already Recorded',
      detail: `The supplier's delivery note "${noteNumber}" is already recorded on inbound delivery "${taken.deliveryNumber}".`,
      errors: [{ field: 'supplierDeliveryNoteNumber', message: 'Already on another delivery' }],
    });
  }

  // Rejects a supplier delivery note dated after the day an announced delivery is expected
  assertDeliveryNoteDate(
    source: InboundDeliverySource,
    noteDate: string | null | undefined,
    expectedDeliveryDate: string,
  ): void {
    if (source !== InboundDeliverySourceValues.ANNOUNCED || !noteDate || noteDate <= expectedDeliveryDate) return;
    throw new BadRequestException({
      label: 'Delivery Note Date Too Late',
      detail: `An announced delivery's note cannot be dated after the day it is expected (${expectedDeliveryDate}).`,
      errors: [{ field: 'supplierDeliveryNoteDate', message: 'After the expected delivery date' }],
    });
  }

  // Rejects a change to a delivery's date, lines or details once it is received or cancelled, or when its goods receipt owns it
  assertEditable(
    delivery: Pick<InboundDeliveryRow, 'deliveryNumber' | 'status' | 'source' | 'sourceGrNumber' | 'isEditable'>,
    label: string,
  ): void {
    if (delivery.isEditable) return;
    throw new BadRequestException({
      label,
      detail:
        delivery.source === InboundDeliverySourceValues.RECEIPT
          ? `"${delivery.deliveryNumber}" was created by goods receipt "${delivery.sourceGrNumber}". Change its lines on that receipt.`
          : `"${delivery.deliveryNumber}" is ${delivery.status}, so it can no longer change.`,
    });
  }

  // Rejects a status the user may not move the delivery to: forward from planned through in transit to arrived, or cancelled while nothing is received against it
  assertStatusChange(
    delivery: Pick<
      InboundDeliveryRow,
      'deliveryNumber' | 'status' | 'source' | 'sourceGrNumber' | 'isEditable' | 'canCancel'
    >,
    status: InboundDeliveryStatus,
  ): void {
    if (delivery.source === InboundDeliverySourceValues.RECEIPT) this.assertEditable(delivery, 'Cannot Change Status');
    if (!InboundDeliveriesDomainRepository.STATUS_TRANSITIONS[delivery.status].includes(status)) {
      throw new BadRequestException({
        label: 'Cannot Change Status',
        detail: `A ${delivery.status} inbound delivery cannot move to ${status}.`,
        errors: [{ field: 'status', message: `Not allowed from ${delivery.status}` }],
      });
    }
    if (status === InboundDeliveryStatusValues.CANCELLED && !delivery.canCancel) {
      throw new BadRequestException({
        label: 'Cannot Cancel',
        detail: `A goods receipt is recorded against "${delivery.deliveryNumber}". Delete its draft receipts first; a delivery with published receipts stays.`,
      });
    }
  }

  // Rejects deleting a delivery unless it is planned, has no lines and no goods receipt names it
  assertDeletable(delivery: Pick<InboundDeliveryRow, 'deliveryNumber' | 'status' | 'lineCount' | 'canDelete'>): void {
    if (delivery.canDelete) return;
    throw new BadRequestException({
      label: 'Cannot Delete',
      detail:
        delivery.status === InboundDeliveryStatusValues.PLANNED && delivery.lineCount > 0
          ? `Remove the lines of "${delivery.deliveryNumber}" before deleting it, or cancel it instead.`
          : `Only a planned inbound delivery without lines or goods receipts can be deleted. Cancel "${delivery.deliveryNumber}" instead.`,
    });
  }

  // Rejects receiving a delivery that is closed, created by a goods receipt, already has a draft receipt, or has nothing left to receive
  assertReceivable(
    delivery: Pick<
      InboundDeliveryRow,
      'deliveryNumber' | 'status' | 'source' | 'sourceGrNumber' | 'isEditable' | 'draftGoodsReceiptId' | 'canReceive'
    >,
  ): void {
    this.assertEditable(delivery, 'Cannot Receive');
    if (delivery.draftGoodsReceiptId) {
      throw new ConflictException({
        label: 'Draft Receipt Exists',
        detail: `A draft goods receipt for "${delivery.deliveryNumber}" is already open. Publish or delete it before receiving again.`,
      });
    }
    if (delivery.canReceive) return;
    throw new BadRequestException({
      label: 'Nothing Left to Receive',
      detail: `Every line of "${delivery.deliveryNumber}" is fully received.`,
    });
  }

  // Selects a delivery with its supplier, line count, purchase order numbers, receipts and what may still happen to it
  private selection() {
    const ownLines = eq(inboundDeliveryLines.inboundDeliveryId, inboundDeliveries.id);
    const ownReceipts = eq(goodsReceipts.inboundDeliveryId, inboundDeliveries.id);
    const anyLine = this.db.select({ id: inboundDeliveryLines.id }).from(inboundDeliveryLines).where(ownLines);
    const anyReceipt = this.db.select({ id: goodsReceipts.id }).from(goodsReceipts).where(ownReceipts);
    const openLine = this.db
      .select({ id: inboundDeliveryLines.id })
      .from(inboundDeliveryLines)
      .where(
        and(
          ownLines,
          sql`${receivedAgainstDelivery(this.db, inboundDeliveryLines.inboundDeliveryId, inboundDeliveryLines.purchaseOrderItemId)} < ${inboundDeliveryLines.quantity}`,
        ),
      );
    const draftReceipt = this.db
      .select({ id: goodsReceipts.id })
      .from(goodsReceipts)
      .where(and(ownReceipts, eq(goodsReceipts.status, GoodsReceiptStatusValues.DRAFT)))
      .orderBy(asc(goodsReceipts.createdAt))
      .limit(1);
    const poNumbers = this.db
      .select({ poNumbers: sql`array_agg(distinct ${purchaseOrders.poNumber} order by ${purchaseOrders.poNumber})` })
      .from(inboundDeliveryLines)
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, inboundDeliveryLines.purchaseOrderItemId))
      .innerJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId))
      .where(ownLines);
    const sourceReceipt = (column: typeof goodsReceipts.id | typeof goodsReceipts.grNumber) =>
      this.db
        .select({ value: column })
        .from(goodsReceipts)
        .where(and(ownReceipts, eq(inboundDeliveries.source, InboundDeliverySourceValues.RECEIPT)))
        .orderBy(asc(goodsReceipts.createdAt))
        .limit(1);
    const isOpen = and(
      notInArray(inboundDeliveries.status, InboundDeliveriesDomainRepository.LOCKED_STATUSES),
      eq(inboundDeliveries.source, InboundDeliverySourceValues.ANNOUNCED),
    );

    return {
      ...getColumns(inboundDeliveries),
      supplierName: parties.displayName,
      lineCount: this.db.$count(inboundDeliveryLines, ownLines),
      poNumbers: sql<string[]>`coalesce((${poNumbers}), '{}')`,
      goodsReceiptCount: this.db.$count(goodsReceipts, ownReceipts),
      draftGoodsReceiptId: sql<string | null>`(${draftReceipt})`,
      sourceGoodsReceiptId: sql<string | null>`(${sourceReceipt(goodsReceipts.id)})`,
      sourceGrNumber: sql<string | null>`(${sourceReceipt(goodsReceipts.grNumber)})`,
      isEditable: sql<boolean>`${isOpen}`,
      canCancel: sql<boolean>`${and(
        inArray(inboundDeliveries.status, InboundDeliveriesDomainRepository.CANCELLABLE_STATUSES),
        notExists(anyReceipt),
      )}`,
      canDelete: sql<boolean>`${and(
        eq(inboundDeliveries.status, InboundDeliveryStatusValues.PLANNED),
        notExists(anyLine),
        notExists(anyReceipt),
      )}`,
      canReceive: sql<boolean>`${and(isOpen, exists(openLine))}`,
    };
  }

  // Joins the supplier and its party for the supplier name
  private joins() {
    return [
      { table: suppliers, on: eq(suppliers.id, inboundDeliveries.supplierId) },
      { table: parties, on: eq(parties.id, suppliers.partyId) },
    ];
  }
}
