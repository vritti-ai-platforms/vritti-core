import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, count, eq, getColumns, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { QueryBuilder } from '@vritti/api-sdk/drizzle-pg-core';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import {
  categories,
  type DisplayUnitRatios,
  displayUnitRatios,
  inventoryItemSites,
  inventoryItems,
  type PurchaseItem,
  type PurchaseItemDocumentType,
  type PurchaseItemSupplierProgress,
  parties,
  purchaseItemAllocations,
  purchaseItemDocuments,
  purchaseItemProgress,
  purchaseItems,
  SiteItemStatusValues,
  siteRequiresSupplierItems,
  supplierQuotationItems,
  suppliers,
  taxClasses,
  uom,
} from '@/db/schema';

export type PurchaseItemRow = PurchaseItem & {
  inventoryItemName: string;
  inventoryItemCode: string;
  primaryUomId: string;
  primaryUomSymbol: string;
  allocatedPrimaryQty: string;
};

export type PurchaseItemTableRow = PurchaseItem & {
  inventoryItemName: string;
  inventoryItemCode: string;
  categoryName: string;
  primaryUomSymbol: string;
  allocatedPrimaryQty: number;
  orderedPrimaryQty: number;
  inTransitPrimaryQty: number;
  receivedPrimaryQty: number;
  invoicedPrimaryQty: number;
  quotingSupplierCount: number;
  suppliers: PurchaseItemSupplierProgress[];
  purchasingBlockedReason: string | null;
  supplierItemsRequired: boolean;
  displayUnitRatios: DisplayUnitRatios;
};

export type PurchaseItemViewRow = PurchaseItemRow & {
  categoryName: string;
  taxClassName: string;
  primaryUomAllowDecimal: boolean;
  purchasingBlockedReason: string | null;
  supplierItemsRequired: boolean;
  displayUnitRatios: DisplayUnitRatios;
};

export type PurchaseItemCountsRow = { allocationCount: number; quoteCount: number; documentCount: number };

export type PurchaseItemProgressRow = {
  primaryQty: number;
  allocatedPrimaryQty: number;
  orderedPrimaryQty: number;
  inTransitPrimaryQty: number;
  receivedPrimaryQty: number;
  invoicedPrimaryQty: number;
  suppliers: PurchaseItemSupplierProgress[];
  displayUnitRatios: DisplayUnitRatios;
};

export type PurchaseItemDocumentRow = {
  lineId: string;
  type: PurchaseItemDocumentType;
  documentId: string;
  documentNumber: string;
  status: string;
  date: string;
  supplierId: string;
  supplierName: string;
  primaryQty: number;
};

export interface QuotingScope {
  siteId: string;
  onDate: string;
}

@Injectable()
export class PurchaseItemsDomainRepository extends PrimaryBaseRepository<typeof purchaseItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, purchaseItems);
  }

  // Returns the items of a purchase with item names, primary units and allocated quantities, by item name
  findByPurchaseId(purchaseId: string): Promise<PurchaseItemRow[]> {
    return this.findAllWithSelect<PurchaseItemRow>({
      select: this.selection(),
      innerJoins: this.joins(),
      where: eq(purchaseItems.purchaseId, purchaseId),
      orderBy: [asc(inventoryItems.name)],
    });
  }

  // Loads a purchase item of the given purchase with its item name, primary unit and allocated quantity
  findDetailOnPurchase(purchaseId: string, itemId: string): Promise<PurchaseItemRow | undefined> {
    return this.findById<PurchaseItemRow>(itemId, {
      select: this.selection(),
      innerJoins: this.joins(),
      where: eq(purchaseItems.purchaseId, purchaseId),
    });
  }

  // Loads the given items of a purchase, leaving out any that are not on it
  findDetailsOnPurchase(purchaseId: string, itemIds: string[]): Promise<PurchaseItemRow[]> {
    if (itemIds.length === 0) return Promise.resolve([]);
    return this.findAllWithSelect<PurchaseItemRow>({
      select: this.selection(),
      innerJoins: this.joins(),
      where: and(eq(purchaseItems.purchaseId, purchaseId), inArray(purchaseItems.id, itemIds)),
    });
  }

  // Sets each given item's requested quantity in one statement
  async updateQuantities(rows: { id: string; primaryQty: number }[]): Promise<void> {
    if (rows.length === 0) return;
    const quantityOfItem = sql.join(
      rows.map((row) => sql`when ${eq(purchaseItems.id, row.id)} then ${row.primaryQty}::numeric`),
      sql` `,
    );
    await this.db
      .update(purchaseItems)
      .set({ primaryQty: sql`case ${quantityOfItem} end` })
      .where(
        inArray(
          purchaseItems.id,
          rows.map((row) => row.id),
        ),
      );
  }

  // Deletes the given items in one statement
  async deleteByIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.deleteMany(inArray(purchaseItems.id, ids));
  }

  // Loads the item line of an inventory item on a purchase
  findForInventoryItem(purchaseId: string, inventoryItemId: string): Promise<PurchaseItem | undefined> {
    return this.findOne({ purchaseId, inventoryItemId });
  }

  // Returns one page of a purchase's items with how far each has got, its category, the suppliers it is allocated to and
  // why the site has blocked buying it, filtered and ordered by already-built clauses
  findForTable(
    purchaseId: string,
    scope: QuotingScope,
    options: { where?: SQL; orderBy: SQL[]; limit: number; offset: number },
  ): Promise<{ result: PurchaseItemTableRow[]; count: number }> {
    return this.findAllAndCount<PurchaseItemTableRow>({
      select: {
        ...getColumns(purchaseItems),
        inventoryItemName: inventoryItems.name,
        inventoryItemCode: inventoryItems.sku,
        categoryName: categories.name,
        primaryUomSymbol: uom.symbol,
        allocatedPrimaryQty: purchaseItemProgress.allocated(),
        orderedPrimaryQty: purchaseItemProgress.ordered(),
        inTransitPrimaryQty: purchaseItemProgress.inTransit(),
        receivedPrimaryQty: purchaseItemProgress.received(),
        invoicedPrimaryQty: purchaseItemProgress.invoiced(),
        quotingSupplierCount: purchaseItemProgress.quotingSuppliers(scope.siteId, scope.onDate),
        suppliers: purchaseItemProgress.bySupplier(),
        purchasingBlockedReason: sql<
          string | null
        >`case when ${inventoryItemSites.status} = ${SiteItemStatusValues.BLOCKED} then ${inventoryItemSites.blockedReason} end`,
        supplierItemsRequired: this.supplierItemsRequired(scope.siteId),
        displayUnitRatios: displayUnitRatios(),
      },
      innerJoins: [...this.joins(), { table: categories, on: eq(categories.id, inventoryItems.categoryId) }],
      leftJoin: {
        table: inventoryItemSites,
        on: and(
          eq(inventoryItemSites.inventoryItemId, purchaseItems.inventoryItemId),
          eq(inventoryItemSites.siteId, scope.siteId),
        ) as SQL,
      },
      where: and(eq(purchaseItems.purchaseId, purchaseId), options.where),
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Counts a purchase's items matching each of the given conditions, and all of them
  async countMatching<TKey extends string>(
    purchaseId: string,
    conditions: Record<TKey, SQL>,
  ): Promise<Record<TKey | 'ALL', number>> {
    const [row] = await this.db
      .select({
        ALL: count(),
        ...Object.fromEntries(
          Object.entries<SQL>(conditions).map(([key, condition]) => [
            key,
            sql<number>`count(*) filter (where ${condition})`.mapWith(Number),
          ]),
        ),
      })
      .from(purchaseItems)
      .where(eq(purchaseItems.purchaseId, purchaseId));
    return row as Record<TKey | 'ALL', number>;
  }

  // Whether some item of a purchase requests more than its allocations cover
  hasUnallocated(purchaseId: string): Promise<boolean> {
    return this.exists(
      and(
        eq(purchaseItems.purchaseId, purchaseId),
        sql`${purchaseItems.primaryQty} > (${this.allocatedTotal()})`,
      ) as SQL,
    );
  }

  // Returns the inventory items of a purchase whose allocations do not yet cover what it requests
  async findUnallocatedItemIds(purchaseId: string): Promise<string[]> {
    const rows = await this.findAllWithSelect<{ inventoryItemId: string }>({
      select: { inventoryItemId: purchaseItems.inventoryItemId },
      where: and(
        eq(purchaseItems.purchaseId, purchaseId),
        sql`${purchaseItems.primaryQty} > (${this.allocatedTotal()})`,
      ),
    });
    return rows.map((row) => row.inventoryItemId);
  }

  // Loads a purchase item of the given purchase as its own page shows it, throwing when it is not on it; the site is the
  // purchase's, whose block on buying the item it carries
  async findViewOnPurchaseOrThrow(purchaseId: string, itemId: string, siteId: string): Promise<PurchaseItemViewRow> {
    const item = await this.findById<PurchaseItemViewRow>(itemId, {
      select: {
        ...this.selection(),
        categoryName: categories.name,
        taxClassName: taxClasses.name,
        primaryUomAllowDecimal: uom.allowDecimal,
        purchasingBlockedReason: sql<
          string | null
        >`case when ${inventoryItemSites.status} = ${SiteItemStatusValues.BLOCKED} then ${inventoryItemSites.blockedReason} end`,
        supplierItemsRequired: this.supplierItemsRequired(siteId),
        displayUnitRatios: displayUnitRatios(),
      },
      innerJoins: [
        ...this.joins(),
        { table: categories, on: eq(categories.id, inventoryItems.categoryId) },
        { table: taxClasses, on: eq(taxClasses.id, inventoryItems.taxClassId) },
      ],
      leftJoin: {
        table: inventoryItemSites,
        on: and(
          eq(inventoryItemSites.inventoryItemId, purchaseItems.inventoryItemId),
          eq(inventoryItemSites.siteId, siteId),
        ) as SQL,
      },
      where: eq(purchaseItems.purchaseId, purchaseId),
    });
    if (!item) throw new NotFoundException('Purchase item not found.');
    return item;
  }

  // Counts what a purchase item's page lists: its allocations, the quotation lines quoting it and its document lines
  async findCountsOrThrow(purchaseId: string, itemId: string): Promise<PurchaseItemCountsRow> {
    const documentCount = new QueryBuilder()
      .select({ total: count() })
      .from(purchaseItemDocuments)
      .where(eq(purchaseItemDocuments.purchaseItemId, purchaseItems.id));
    const counts = await this.findById<PurchaseItemCountsRow>(itemId, {
      select: {
        allocationCount: this.db.$count(
          purchaseItemAllocations,
          eq(purchaseItemAllocations.purchaseItemId, purchaseItems.id),
        ),
        quoteCount: this.db.$count(supplierQuotationItems, eq(supplierQuotationItems.purchaseItemId, purchaseItems.id)),
        documentCount: sql<number>`(${documentCount})`.mapWith(Number),
      },
      where: eq(purchaseItems.purchaseId, purchaseId),
    });
    if (!counts) throw new NotFoundException('Purchase item not found.');
    return counts;
  }

  // Returns how far a purchase item has got in primary units, in all and per supplier
  async findProgressOrThrow(purchaseId: string, itemId: string): Promise<PurchaseItemProgressRow> {
    const progress = await this.findById<PurchaseItemProgressRow>(itemId, {
      select: {
        primaryQty: purchaseItems.primaryQty,
        allocatedPrimaryQty: purchaseItemProgress.allocated(),
        orderedPrimaryQty: purchaseItemProgress.ordered(),
        inTransitPrimaryQty: purchaseItemProgress.inTransit(),
        receivedPrimaryQty: purchaseItemProgress.received(),
        invoicedPrimaryQty: purchaseItemProgress.invoiced(),
        suppliers: purchaseItemProgress.bySupplier(),
        displayUnitRatios: displayUnitRatios(),
      },
      innerJoins: [{ table: inventoryItems, on: eq(inventoryItems.id, purchaseItems.inventoryItemId) }],
      where: eq(purchaseItems.purchaseId, purchaseId),
    });
    if (!progress) throw new NotFoundException('Purchase item not found.');
    return progress;
  }

  // Returns how the item of a purchase item turns its primary unit into its display unit, throwing when the purchase item
  // is not on the purchase
  async findDisplayUnitRatiosOrThrow(purchaseId: string, itemId: string): Promise<DisplayUnitRatios> {
    const row = await this.findById<{ displayUnitRatios: DisplayUnitRatios }>(itemId, {
      select: { displayUnitRatios: displayUnitRatios() },
      innerJoins: [{ table: inventoryItems, on: eq(inventoryItems.id, purchaseItems.inventoryItemId) }],
      where: eq(purchaseItems.purchaseId, purchaseId),
    });
    if (!row) throw new NotFoundException('Purchase item not found.');
    return row.displayUnitRatios;
  }

  // Returns one page of the document lines that move a purchase item, with each supplier's name, filtered and ordered by
  // already-built clauses over the documents' columns
  async findDocumentsForTable(
    itemId: string,
    options: { where?: SQL; orderBy: SQL[]; limit: number; offset: number },
  ): Promise<{ result: PurchaseItemDocumentRow[]; count: number }> {
    const where = and(eq(purchaseItemDocuments.purchaseItemId, itemId), options.where);
    const result = await this.db
      .select({
        lineId: purchaseItemDocuments.lineId,
        type: purchaseItemDocuments.type,
        documentId: purchaseItemDocuments.documentId,
        documentNumber: purchaseItemDocuments.documentNumber,
        status: purchaseItemDocuments.status,
        date: purchaseItemDocuments.date,
        supplierId: purchaseItemDocuments.supplierId,
        supplierName: parties.displayName,
        primaryQty: sql<number>`${purchaseItemDocuments.primaryQty}`.mapWith(Number),
      })
      .from(purchaseItemDocuments)
      .innerJoin(suppliers, eq(suppliers.id, purchaseItemDocuments.supplierId))
      .innerJoin(parties, eq(parties.id, suppliers.partyId))
      .where(where)
      .orderBy(...options.orderBy)
      .limit(options.limit)
      .offset(options.offset);
    const [total] = await this.db.select({ total: count() }).from(purchaseItemDocuments).where(where);
    return { result, count: total.total };
  }

  // Loads a purchase item of the given purchase, throwing when it is not on it
  async findOnPurchaseOrThrow(purchaseId: string, itemId: string): Promise<PurchaseItemRow> {
    const item = await this.findDetailOnPurchase(purchaseId, itemId);
    if (!item) throw new NotFoundException('Purchase item not found.');
    return item;
  }

  // Loads the given items of a purchase, throwing when any is not on it
  async findManyOnPurchaseOrThrow(purchaseId: string, itemIds: string[]): Promise<PurchaseItemRow[]> {
    const ids = [...new Set(itemIds)];
    const items = await this.findDetailsOnPurchase(purchaseId, ids);
    if (items.length < ids.length) throw new NotFoundException('Purchase item not found.');
    return items;
  }

  // Sums the allocated primary quantities of the outer purchase item
  private allocatedTotal() {
    return this.db
      .select({ total: sql`coalesce(sum(${purchaseItemAllocations.primaryUomQty}), 0)` })
      .from(purchaseItemAllocations)
      .where(eq(purchaseItemAllocations.purchaseItemId, purchaseItems.id));
  }

  // Selects a purchase item with its item name and code, its primary unit and the sum of its allocated primary quantities
  private selection() {
    return {
      ...getColumns(purchaseItems),
      inventoryItemName: inventoryItems.name,
      inventoryItemCode: inventoryItems.sku,
      primaryUomId: inventoryItems.uomId,
      primaryUomSymbol: uom.symbol,
      allocatedPrimaryQty: sql<string>`(${this.allocatedTotal()})`,
    };
  }

  // Joins the inventory item and its primary unit
  private joins() {
    return [
      { table: inventoryItems, on: eq(inventoryItems.id, purchaseItems.inventoryItemId) },
      { table: uom, on: eq(uom.id, inventoryItems.uomId) },
    ];
  }

  // Whether the site's rules tie buying the item to the supplier's items: the site's own rule, or its flag on the item
  // (the site item is joined)
  private supplierItemsRequired(siteId: string): SQL<boolean> {
    return sql<boolean>`(coalesce(${inventoryItemSites.supplierItemsRequired}, false) or ${siteRequiresSupplierItems(siteId)})`;
  }
}
