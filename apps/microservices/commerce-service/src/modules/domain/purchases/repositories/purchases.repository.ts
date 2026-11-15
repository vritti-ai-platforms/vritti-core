import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, exists, getColumns, isNull, notInArray, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  GoodsReceiptStatusValues,
  goodsReceiptItems,
  goodsReceipts,
  InboundDeliveryStatusValues,
  inboundDeliveries,
  inboundDeliveryLines,
  type Purchase,
  PurchaseLegStatusValues,
  PurchaseLegStepValues,
  PurchaseOrderStatusValues,
  PurchaseStatusValues,
  PurchaseStepValues,
  purchaseItemAllocations,
  purchaseItems,
  purchaseNumberSeq,
  purchaseOrderItems,
  purchaseOrders,
  purchaseSuppliers,
  purchases,
  supplierQuotationSites,
  supplierQuotations,
} from '@/db/schema';

export type PurchaseRow = Purchase & { itemCount: number };

export type PurchaseProgressItemRow = {
  requested: number;
  allocated: number;
  ordered: number;
  inTransit: number;
  received: number;
  invoiced: number;
};

export type PurchaseProgressRow = {
  postedSuppliers: number | null;
  items: PurchaseProgressItemRow[];
};

export type PurchaseTableRow = PurchaseRow & { progress: PurchaseProgressRow };

export type PurchaseHeaderRow = PurchaseTableRow & {
  supplierCount: number;
  hasSourcingLeg: boolean;
};

@Injectable()
export class PurchasesDomainRepository extends PrimaryBaseRepository<typeof purchases> {
  constructor(database: PrimaryDatabaseService) {
    super(database, purchases, { sequence: purchaseNumberSeq });
  }

  // Generates the next sequential purchase number for the current month
  async generatePurchaseNumber(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextNumber = await this.nextSequenceValue();
    return `PUR-${yearMonth}-${String(nextNumber).padStart(4, '0')}`;
  }

  // Loads a purchase with its item line count
  findDetail(id: string): Promise<PurchaseRow | undefined> {
    return this.findById<PurchaseRow>(id, { select: this.selection() });
  }

  // Loads a purchase with its item line count, its progress through its step, its leg count and whether a leg is still
  // open in sourcing
  findHeader(id: string): Promise<PurchaseHeaderRow | undefined> {
    return this.findById<PurchaseHeaderRow>(id, {
      select: {
        ...this.selection(),
        progress: this.progress(),
        supplierCount: this.db.$count(purchaseSuppliers, eq(purchaseSuppliers.purchaseId, purchases.id)),
        hasSourcingLeg: sql<boolean>`${exists(this.sourcingLegs())}`,
      },
    });
  }

  // Deletes the purchase only while it is open in REQUESTING, returning whether it did
  async deleteRequesting(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(purchases)
      .where(
        and(
          eq(purchases.id, id),
          eq(purchases.status, PurchaseStatusValues.OPEN),
          eq(purchases.step, PurchaseStepValues.REQUESTING),
        ),
      )
      .returning({ id: purchases.id });
    return deleted.length > 0;
  }

  // Returns one page of purchases with their item line counts and their progress through their step
  findForTable(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: PurchaseTableRow[]; count: number }> {
    return this.findAllAndCount<PurchaseTableRow>({
      select: { ...this.selection(), progress: this.progress() },
      ...options,
    });
  }

  // Selects a purchase with its item line count
  private selection() {
    return {
      ...getColumns(purchases),
      itemCount: this.db.$count(purchaseItems, eq(purchaseItems.purchaseId, purchases.id)),
    };
  }

  // Selects the purchase's legs still open in sourcing
  private sourcingLegs() {
    return this.db
      .select({ one: sql`1` })
      .from(purchaseSuppliers)
      .where(
        and(
          eq(purchaseSuppliers.purchaseId, purchases.id),
          eq(purchaseSuppliers.status, PurchaseLegStatusValues.OPEN),
          eq(purchaseSuppliers.step, PurchaseLegStepValues.SOURCING),
        ),
      );
  }

  // Selects the purchase's progress as JSON; only the branch for the purchase's own step runs
  private progress(): SQL<PurchaseProgressRow> {
    return sql<PurchaseProgressRow>`case
      when ${eq(purchases.step, PurchaseStepValues.QUOTING)} then (${this.quotingProgress()})
      when ${eq(purchases.step, PurchaseStepValues.SOURCING)} then (${this.sourcingProgress()})
      when ${eq(purchases.step, PurchaseStepValues.PROCURING)} then (${this.procuringProgress()})
      else json_build_object('postedSuppliers', null, 'items', '[]'::json)
    end`;
  }

  // Counts the suppliers with a quotation for the purchase posted to its site or its whole legal entity
  private quotingProgress() {
    const posted = this.db
      .select({ one: sql`1` })
      .from(supplierQuotationSites)
      .where(
        and(
          eq(supplierQuotationSites.quotationId, supplierQuotations.id),
          or(eq(supplierQuotationSites.siteId, purchases.siteId), isNull(supplierQuotationSites.siteId)),
        ),
      );
    return this.db
      .select({
        progress: sql`json_build_object(
          'postedSuppliers', count(distinct ${supplierQuotations.supplierId}),
          'items', '[]'::json
        )`,
      })
      .from(supplierQuotations)
      .where(and(eq(supplierQuotations.purchaseId, purchases.id), exists(posted)));
  }

  // Lists each item's requested and allocated primary quantities
  private sourcingProgress() {
    const allocated = this.db
      .select({ total: sql`coalesce(sum(${purchaseItemAllocations.primaryUomQty}), 0)` })
      .from(purchaseItemAllocations)
      .where(eq(purchaseItemAllocations.purchaseItemId, purchaseItems.id));
    return this.db
      .select({
        progress: sql`json_build_object(
          'postedSuppliers', null,
          'items', coalesce(json_agg(json_build_object(
            'requested', ${purchaseItems.primaryQty},
            'allocated', (${allocated}),
            'ordered', 0,
            'inTransit', 0,
            'received', 0,
            'invoiced', 0
          )), '[]'::json)
        )`,
      })
      .from(purchaseItems)
      .where(eq(purchaseItems.purchaseId, purchases.id));
  }

  // Lists each item's requested primary quantity with what its allocations allocated and their PO lines ordered
  // (live orders only), carry on open deliveries, received net of returns and invoiced
  private procuringProgress() {
    const liveOrder = notInArray(purchaseOrders.status, [
      PurchaseOrderStatusValues.CANCELLED,
      PurchaseOrderStatusValues.REJECTED,
    ]);
    const items = this.db
      .select({
        requested: sql`${purchaseItems.primaryQty}`.as('requested'),
        allocated: sql`coalesce(sum(${purchaseItemAllocations.primaryUomQty}), 0)`.as('allocated'),
        ordered:
          sql`coalesce(sum(${purchaseOrderItems.primaryUomQty} + ${purchaseOrderItems.freePrimaryQty} - ${purchaseOrderItems.cancelledPrimaryQty}) filter (where ${liveOrder}), 0)`.as(
            'ordered',
          ),
        inTransit: sql`coalesce(sum(${this.inTransitOnOrderLine()}), 0)`.as('in_transit'),
        received:
          sql`coalesce(sum(${purchaseOrderItems.receivedPrimaryQty} - ${purchaseOrderItems.returnedPrimaryQty}), 0)`.as(
            'received',
          ),
        invoiced: sql`coalesce(sum(${purchaseOrderItems.invoicedPrimaryQty}), 0)`.as('invoiced'),
      })
      .from(purchaseItems)
      .leftJoin(purchaseItemAllocations, eq(purchaseItemAllocations.purchaseItemId, purchaseItems.id))
      .leftJoin(purchaseOrderItems, eq(purchaseOrderItems.id, purchaseItemAllocations.purchaseOrderItemId))
      .leftJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId))
      .where(eq(purchaseItems.purchaseId, purchases.id))
      .groupBy(purchaseItems.id)
      .as('progress_items');
    return this.db
      .select({
        progress: sql`json_build_object(
          'postedSuppliers', null,
          'items', coalesce(json_agg(json_build_object(
            'requested', ${items.requested},
            'allocated', ${items.allocated},
            'ordered', ${items.ordered},
            'inTransit', ${items.inTransit},
            'received', ${items.received},
            'invoiced', ${items.invoiced}
          )), '[]'::json)
        )`,
      })
      .from(items);
  }

  // Sums what the outer PO line's open deliveries carry that posted receipts have not yet accepted, in primary units
  private inTransitOnOrderLine(): SQL {
    const accepted = this.db
      .select({
        total: sql`coalesce(sum(${goodsReceiptItems.receivedPrimaryQty} - ${goodsReceiptItems.rejectedPrimaryQty}), 0)`,
      })
      .from(goodsReceiptItems)
      .innerJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId))
      .where(
        and(
          eq(goodsReceiptItems.inboundDeliveryLineId, inboundDeliveryLines.id),
          eq(goodsReceipts.status, GoodsReceiptStatusValues.POSTED),
        ),
      );
    const outstanding = this.db
      .select({ total: sql`coalesce(sum(greatest(${inboundDeliveryLines.primaryUomQty} - (${accepted}), 0)), 0)` })
      .from(inboundDeliveryLines)
      .innerJoin(inboundDeliveries, eq(inboundDeliveries.id, inboundDeliveryLines.inboundDeliveryId))
      .where(
        and(
          eq(inboundDeliveryLines.purchaseOrderItemId, purchaseOrderItems.id),
          notInArray(inboundDeliveries.status, [
            InboundDeliveryStatusValues.RECEIVED,
            InboundDeliveryStatusValues.CANCELLED,
          ]),
        ),
      );
    return sql`(${outstanding})`;
  }
}
