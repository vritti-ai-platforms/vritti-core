import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { aliasedTable, and, asc, eq, getColumns, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import {
  type InventoryTracking,
  inventoryItemSites,
  inventoryItems,
  type NewPurchaseItemAllocation,
  type Purchase,
  type PurchaseItemAllocation,
  type PurchaseLegStatus,
  type PurchaseLegStep,
  type PurchaseOrderStatus,
  type PurchaseStatus,
  type PurchaseType,
  purchaseItemAllocations,
  purchaseItems,
  purchaseOrderItems,
  purchaseOrders,
  purchaseSuppliers,
  purchases,
  SiteItemStatusValues,
  supplierQuotationItems,
  supplierQuotations,
  uom,
} from '@/db/schema';

const primaryUom = aliasedTable(uom, 'primary_uom');

export type PurchaseAllocationRow = PurchaseItemAllocation & {
  purchaseOrderId: string | null;
  inventoryItemName: string;
  uomSymbol: string;
  quotationNumber: string | null;
  // Why the purchase's site has blocked buying the item; null while it has not
  purchasingBlockedReason: string | null;
};

export type PurchaseItemAllocationTableRow = PurchaseAllocationRow & {
  poNumber: string | null;
  poStatus: PurchaseOrderStatus | null;
  receivedPrimaryQty: number | null;
  invoicedPrimaryQty: number | null;
};

export type AllocationWithLegRow = PurchaseItemAllocation & {
  purchaseId: string;
  purchaseNumber: string;
  purchaseStatus: PurchaseStatus;
  siteId: string;
  supplierId: string;
  legType: PurchaseType;
  legStep: PurchaseLegStep;
  legStatus: PurchaseLegStatus;
  inventoryItemId: string;
  inventoryItemName: string;
  tracking: InventoryTracking;
  uomSymbol: string;
  primaryUomSymbol: string;
  purchaseOrderId: string | null;
  purchaseOrderStatus: PurchaseOrderStatus | null;
  purchaseOrderCurrencyCode: string | null;
  orderedUomQty: number | null;
  orderedPrimaryUomQty: number | null;
  receivedPrimaryQty: number | null;
  // Why the purchase's site has blocked buying the item; null while it has not
  purchasingBlockedReason: string | null;
};

export type AllocationWithLegFilter = {
  supplierId?: string;
  purchaseSupplierId?: string;
  siteId?: string;
  allocationIds?: string[];
  legTypes?: PurchaseType[];
};

export type AllocationPurchase = Pick<Purchase, 'id' | 'purchaseNumber' | 'status' | 'quotationsRequired'>;

@Injectable()
export class PurchaseItemAllocationsDomainRepository extends PrimaryBaseRepository<typeof purchaseItemAllocations> {
  constructor(database: PrimaryDatabaseService) {
    super(database, purchaseItemAllocations);
  }

  // Returns every allocation of a purchase's items with its item and unit names and its quotation number, by item name
  findByPurchaseId(purchaseId: string): Promise<PurchaseAllocationRow[]> {
    return this.findAllWithSelect<PurchaseAllocationRow>({
      select: this.selection(),
      innerJoins: this.itemJoins(),
      leftJoins: this.termJoins(),
      where: eq(purchaseItems.purchaseId, purchaseId),
      orderBy: [asc(inventoryItems.name)],
    });
  }

  // Returns every allocation of the given legs with its item and unit names and its quotation number, by item name
  findDetailByLegIds(purchaseSupplierIds: string[]): Promise<PurchaseAllocationRow[]> {
    if (purchaseSupplierIds.length === 0) return Promise.resolve([]);
    return this.findAllWithSelect<PurchaseAllocationRow>({
      select: this.selection(),
      innerJoins: this.itemJoins(),
      leftJoins: this.termJoins(),
      where: inArray(purchaseItemAllocations.purchaseSupplierId, purchaseSupplierIds),
      orderBy: [asc(inventoryItems.name)],
    });
  }

  // Returns every allocation of the given purchase items with its item and unit names and its quotation number
  findDetailByItemIds(purchaseItemIds: string[]): Promise<PurchaseAllocationRow[]> {
    if (purchaseItemIds.length === 0) return Promise.resolve([]);
    return this.findAllWithSelect<PurchaseAllocationRow>({
      select: this.selection(),
      innerJoins: this.itemJoins(),
      leftJoins: this.termJoins(),
      where: inArray(purchaseItemAllocations.purchaseItemId, purchaseItemIds),
      orderBy: [asc(inventoryItems.name)],
    });
  }

  // Returns one page of a purchase item's allocations with the PO each became and what of its line is received and
  // invoiced, filtered and ordered by already-built clauses
  findForItemTable(
    purchaseId: string,
    itemId: string,
    options: { where?: SQL; orderBy: SQL[]; limit: number; offset: number },
  ): Promise<{ result: PurchaseItemAllocationTableRow[]; count: number }> {
    return this.findAllAndCount<PurchaseItemAllocationTableRow>({
      select: {
        ...this.selection(),
        poNumber: purchaseOrders.poNumber,
        poStatus: purchaseOrders.status,
        receivedPrimaryQty: sql<
          number | null
        >`${purchaseOrderItems.receivedPrimaryQty} - ${purchaseOrderItems.returnedPrimaryQty}`.mapWith(Number),
        invoicedPrimaryQty: sql<number | null>`${purchaseOrderItems.invoicedPrimaryQty}`.mapWith(Number),
      },
      innerJoins: [
        ...this.itemJoins(),
        { table: purchaseSuppliers, on: eq(purchaseSuppliers.id, purchaseItemAllocations.purchaseSupplierId) },
      ],
      leftJoins: [
        ...this.termJoins(),
        { table: purchaseOrders, on: eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId) },
      ],
      where: and(
        eq(purchaseItems.purchaseId, purchaseId),
        eq(purchaseItemAllocations.purchaseItemId, itemId),
        options.where,
      ),
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Loads an allocation of the given purchase's items with its item and unit names and its quotation number
  findDetailOnPurchase(purchaseId: string, allocationId: string): Promise<PurchaseAllocationRow | undefined> {
    return this.findById<PurchaseAllocationRow>(allocationId, {
      select: this.selection(),
      innerJoins: this.itemJoins(),
      leftJoins: this.termJoins(),
      where: eq(purchaseItems.purchaseId, purchaseId),
    });
  }

  // Returns the allocations of a leg
  findByLegId(purchaseSupplierId: string): Promise<PurchaseItemAllocation[]> {
    return this.findMany({ where: { purchaseSupplierId } });
  }

  // Loads the allocations of any of the given purchase items to any of the given legs
  findForItemsOnLegs(purchaseItemIds: string[], purchaseSupplierIds: string[]): Promise<PurchaseItemAllocation[]> {
    if (purchaseItemIds.length === 0 || purchaseSupplierIds.length === 0) return Promise.resolve([]);
    return this.db
      .select()
      .from(purchaseItemAllocations)
      .where(
        and(
          inArray(purchaseItemAllocations.purchaseItemId, purchaseItemIds),
          inArray(purchaseItemAllocations.purchaseSupplierId, purchaseSupplierIds),
        ),
      );
  }

  // Inserts many allocations in one statement
  async createMany(rows: NewPurchaseItemAllocation[]): Promise<PurchaseItemAllocation[]> {
    if (rows.length === 0) return [];
    return this.db.insert(purchaseItemAllocations).values(rows).returning();
  }

  // Loads the allocation of a purchase item to a leg
  findForItemAndLeg(purchaseItemId: string, purchaseSupplierId: string): Promise<PurchaseItemAllocation | undefined> {
    return this.findOne({ purchaseItemId, purchaseSupplierId });
  }

  // Counts the allocations of a leg
  countByLeg(purchaseSupplierId: string): Promise<number> {
    return this.count(eq(purchaseItemAllocations.purchaseSupplierId, purchaseSupplierId));
  }

  // Returns allocations narrowed to a supplier, leg, site, ids and leg types when given, with their purchase, leg, item
  // tracking, units and the PO line they became with its order and received counter, by purchase number and item name
  findWithLegs(filter: AllocationWithLegFilter): Promise<AllocationWithLegRow[]> {
    return this.findAllWithSelect<AllocationWithLegRow>({
      select: {
        ...getColumns(purchaseItemAllocations),
        purchaseId: purchases.id,
        purchaseNumber: purchases.purchaseNumber,
        purchaseStatus: purchases.status,
        siteId: purchases.siteId,
        supplierId: purchaseSuppliers.supplierId,
        legType: purchaseSuppliers.type,
        legStep: purchaseSuppliers.step,
        legStatus: purchaseSuppliers.status,
        inventoryItemId: inventoryItems.id,
        inventoryItemName: inventoryItems.name,
        tracking: inventoryItems.tracking,
        uomSymbol: uom.symbol,
        primaryUomSymbol: primaryUom.symbol,
        purchaseOrderId: purchaseOrders.id,
        purchaseOrderStatus: purchaseOrders.status,
        purchaseOrderCurrencyCode: purchaseOrders.currencyCode,
        orderedUomQty: purchaseOrderItems.uomQty,
        orderedPrimaryUomQty: purchaseOrderItems.primaryUomQty,
        receivedPrimaryQty: purchaseOrderItems.receivedPrimaryQty,
        purchasingBlockedReason: this.purchasingBlockedReasonSql(),
      },
      innerJoins: [
        ...this.itemJoins(),
        { table: purchases, on: eq(purchases.id, purchaseItems.purchaseId) },
        { table: purchaseSuppliers, on: eq(purchaseSuppliers.id, purchaseItemAllocations.purchaseSupplierId) },
        { table: primaryUom, on: eq(primaryUom.id, inventoryItems.uomId) },
      ],
      leftJoins: [
        { table: purchaseOrderItems, on: eq(purchaseOrderItems.id, purchaseItemAllocations.purchaseOrderItemId) },
        { table: purchaseOrders, on: eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId) },
      ],
      where: and(
        filter.supplierId ? eq(purchaseSuppliers.supplierId, filter.supplierId) : undefined,
        filter.purchaseSupplierId ? eq(purchaseSuppliers.id, filter.purchaseSupplierId) : undefined,
        filter.siteId ? eq(purchases.siteId, filter.siteId) : undefined,
        filter.allocationIds ? inArray(purchaseItemAllocations.id, filter.allocationIds) : undefined,
        filter.legTypes ? inArray(purchaseSuppliers.type, filter.legTypes) : undefined,
      ),
      orderBy: [asc(purchases.purchaseNumber), asc(inventoryItems.name)],
    });
  }

  // Points each allocation at the PO line it became
  async linkOrderLines(links: { allocationId: string; purchaseOrderItemId: string }[]): Promise<void> {
    if (links.length === 0) return;
    const lineOfAllocation = sql.join(
      links.map(
        (link) => sql`when ${eq(purchaseItemAllocations.id, link.allocationId)} then ${link.purchaseOrderItemId}::uuid`,
      ),
      sql` `,
    );
    await this.db
      .update(purchaseItemAllocations)
      .set({ purchaseOrderItemId: sql`case ${lineOfAllocation} end` })
      .where(
        inArray(
          purchaseItemAllocations.id,
          links.map((link) => link.allocationId),
        ),
      );
  }

  // Deletes every allocation of a leg
  async deleteByLegId(purchaseSupplierId: string): Promise<void> {
    await this.deleteMany(eq(purchaseItemAllocations.purchaseSupplierId, purchaseSupplierId));
  }

  // Clears the PO line of the allocations that became the given lines
  async unlinkOrderLines(purchaseOrderItemIds: string[]): Promise<void> {
    if (purchaseOrderItemIds.length === 0) return;
    await this.updateMany(inArray(purchaseItemAllocations.purchaseOrderItemId, purchaseOrderItemIds), {
      purchaseOrderItemId: null,
    });
  }

  // Returns the unit price an allocation is ordered at, rejecting one without a price and naming its item
  requireUnitPrice(allocation: Pick<PurchaseItemAllocation, 'unitPrice'> & { inventoryItemName: string }): bigint {
    if (allocation.unitPrice !== null) return allocation.unitPrice;
    throw new BadRequestException({
      label: 'Price Missing',
      detail: `"${allocation.inventoryItemName}" has no unit price on its allocation. Price it before ordering.`,
    });
  }

  // Loads an allocation of the given purchase, throwing when it is not on it
  async findOnPurchaseOrThrow(purchaseId: string, allocationId: string): Promise<PurchaseAllocationRow> {
    const allocation = await this.findDetailOnPurchase(purchaseId, allocationId);
    if (!allocation) throw new NotFoundException('Allocation not found.');
    return allocation;
  }

  // Rejects an entered allocation on a purchase that requires quotations; its allocations come from quotation lines
  assertEnteredAllowed(purchase: AllocationPurchase): void {
    if (!purchase.quotationsRequired) return;
    throw new BadRequestException({
      label: 'Allocate From Quotations',
      detail: `"${purchase.purchaseNumber}" requires quotations, so its items are allocated from posted quotation lines.`,
    });
  }

  // Selects an allocation with its PO, item name, unit symbol, the number of the quotation it was awarded from and why the
  // site has blocked buying its item
  private selection() {
    return {
      ...getColumns(purchaseItemAllocations),
      purchaseOrderId: purchaseOrderItems.purchaseOrderId,
      inventoryItemName: inventoryItems.name,
      uomSymbol: uom.symbol,
      quotationNumber: supplierQuotations.quotationNumber,
      purchasingBlockedReason: this.purchasingBlockedReasonSql(),
    };
  }

  // Why the purchase's site has blocked buying the allocation's item, or null while it has not
  private purchasingBlockedReasonSql() {
    return sql<string | null>`(${this.db
      .select({ reason: inventoryItemSites.blockedReason })
      .from(inventoryItemSites)
      .innerJoin(purchases, eq(purchases.siteId, inventoryItemSites.siteId))
      .where(
        and(
          eq(purchases.id, purchaseItems.purchaseId),
          eq(inventoryItemSites.inventoryItemId, inventoryItems.id),
          eq(inventoryItemSites.status, SiteItemStatusValues.BLOCKED),
        ),
      )})`;
  }

  // Joins the purchase item the allocation sources, its inventory item and the allocation's unit
  private itemJoins() {
    return [
      { table: purchaseItems, on: eq(purchaseItems.id, purchaseItemAllocations.purchaseItemId) },
      { table: inventoryItems, on: eq(inventoryItems.id, purchaseItems.inventoryItemId) },
      { table: uom, on: eq(uom.id, purchaseItemAllocations.uomId) },
    ];
  }

  // Joins the PO line the allocation became and the quotation line it was awarded from, when any
  private termJoins() {
    return [
      { table: purchaseOrderItems, on: eq(purchaseOrderItems.id, purchaseItemAllocations.purchaseOrderItemId) },
      {
        table: supplierQuotationItems,
        on: eq(supplierQuotationItems.id, purchaseItemAllocations.supplierQuotationItemId),
      },
      { table: supplierQuotations, on: eq(supplierQuotations.id, supplierQuotationItems.quotationId) },
    ];
  }
}
