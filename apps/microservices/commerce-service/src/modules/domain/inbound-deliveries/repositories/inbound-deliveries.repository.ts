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
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import type { FindForSelectConfig, SelectQueryResult } from '@vritti/api-sdk/select';
import {
  GoodsReceiptStatusValues,
  goodsReceipts,
  type InboundDelivery,
  InboundDeliverySourceValues,
  type InboundDeliveryStatus,
  InboundDeliveryStatusValues,
  inboundDeliveries,
  inboundDeliveryLines,
  inboundDeliveryNumberSeq,
  parties,
  purchaseOrderItems,
  purchaseOrders,
  purchases,
  suppliers,
} from '@/db/schema';
import { acceptedOnDeliveryLine } from './delivery-quantities';

export type InboundDeliveryReceiptProgress = Pick<InboundDelivery, 'id' | 'deliveryNumber' | 'status' | 'source'> & {
  hasPostedReceipt: boolean;
  hasShortLine: boolean;
};

export type InboundDeliveryCounts = {
  lineCount: number;
};

export type InboundDeliveryRow = InboundDelivery &
  InboundDeliveryCounts & {
    supplierName: string | null;
    purchaseNumber: string | null;
    poNumbers: string[];
    goodsReceiptCount: number;
    draftGoodsReceiptId: string | null;
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

  // Loads a delivery with its supplier, lines, purchase orders, receipts and what may still happen to it
  findDetail(id: string): Promise<InboundDeliveryRow | undefined> {
    return this.findById<InboundDeliveryRow>(id, { select: this.selection(), leftJoins: this.joins() });
  }

  // Counts a delivery's lines, throwing when it is out of reach
  async findCountsOrThrow(id: string): Promise<InboundDeliveryCounts> {
    const counts = await this.findById<InboundDeliveryCounts>(id, { select: this.counts() });
    if (!counts) throw new NotFoundException('Inbound delivery not found.');
    return counts;
  }

  // Returns the deliveries a purchase created, oldest first
  findForPurchase(purchaseId: string): Promise<InboundDeliveryRow[]> {
    return this.findAllWithSelect<InboundDeliveryRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: eq(inboundDeliveries.purchaseId, purchaseId),
      orderBy: [asc(inboundDeliveries.createdAt)],
    });
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

  // Loads a delivery's status and source with whether a posted receipt counts it and whether a line is still short of
  // what was accepted against it
  async findReceiptProgress(id: string): Promise<InboundDeliveryReceiptProgress | undefined> {
    const ownLines = eq(inboundDeliveryLines.inboundDeliveryId, inboundDeliveries.id);
    const shortLine = this.db
      .select({ id: inboundDeliveryLines.id })
      .from(inboundDeliveryLines)
      .where(
        and(
          ownLines,
          sql`${acceptedOnDeliveryLine(this.db, inboundDeliveryLines.id)} < ${inboundDeliveryLines.primaryUomQty}`,
        ),
      );
    const postedReceipt = this.db
      .select({ id: goodsReceipts.id })
      .from(goodsReceipts)
      .where(
        and(
          eq(goodsReceipts.inboundDeliveryId, inboundDeliveries.id),
          eq(goodsReceipts.status, GoodsReceiptStatusValues.POSTED),
        ),
      );
    const [progress] = await this.db
      .select({
        id: inboundDeliveries.id,
        deliveryNumber: inboundDeliveries.deliveryNumber,
        status: inboundDeliveries.status,
        source: inboundDeliveries.source,
        hasPostedReceipt: sql<boolean>`${exists(postedReceipt)}`,
        hasShortLine: sql<boolean>`${exists(shortLine)}`,
      })
      .from(inboundDeliveries)
      .where(eq(inboundDeliveries.id, id))
      .limit(1);
    return progress;
  }

  // Returns the site's ANNOUNCED inbound deliveries still open, without a draft receipt and with something left to receive, for a goods receipt's delivery picker
  findForSelectReceivable(config: FindForSelectConfig): Promise<SelectQueryResult> {
    const ownLines = eq(inboundDeliveryLines.inboundDeliveryId, inboundDeliveries.id);
    const openLine = this.db
      .select({ id: inboundDeliveryLines.id })
      .from(inboundDeliveryLines)
      .where(
        and(
          ownLines,
          sql`${acceptedOnDeliveryLine(this.db, inboundDeliveryLines.id)} < ${inboundDeliveryLines.primaryUomQty}`,
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
        siteId: sql`${inboundDeliveries.siteId}`,
      },
    });
  }

  // Returns the number of another non-cancelled delivery of the supplier carrying the delivery note number, compared
  // case-insensitively
  async findDeliveryNumberByNote(
    supplierId: string,
    noteNumber: string,
    excludeDeliveryId?: string,
  ): Promise<string | undefined> {
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
    return taken?.deliveryNumber;
  }

  // Selects a delivery with its supplier, line count, purchase order numbers, receipts and what may still happen to it; only an ANNOUNCED inbound delivery is changed here
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
          sql`${acceptedOnDeliveryLine(this.db, inboundDeliveryLines.id)} < ${inboundDeliveryLines.primaryUomQty}`,
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
    const isOpen = and(
      notInArray(inboundDeliveries.status, InboundDeliveriesDomainRepository.LOCKED_STATUSES),
      eq(inboundDeliveries.source, InboundDeliverySourceValues.ANNOUNCED),
    );

    return {
      ...getColumns(inboundDeliveries),
      supplierName: parties.displayName,
      purchaseNumber: purchases.purchaseNumber,
      ...this.counts(),
      poNumbers: sql<string[]>`coalesce((${poNumbers}), '{}')`,
      goodsReceiptCount: this.db.$count(goodsReceipts, ownReceipts),
      draftGoodsReceiptId: sql<string | null>`(${draftReceipt})`,
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

  // Counts the rows each of a delivery's tabs lists: its lines
  private counts() {
    return {
      lineCount: this.db.$count(inboundDeliveryLines, eq(inboundDeliveryLines.inboundDeliveryId, inboundDeliveries.id)),
    };
  }

  // Joins the supplier and its party for the supplier name, and the purchase that created the delivery
  private joins() {
    return [
      { table: suppliers, on: eq(suppliers.id, inboundDeliveries.supplierId) },
      { table: parties, on: eq(parties.id, suppliers.partyId) },
      { table: purchases, on: eq(purchases.id, inboundDeliveries.purchaseId) },
    ];
  }
}
