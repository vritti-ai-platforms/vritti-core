import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { aliasedTable, and, asc, eq, getColumns, inArray } from '@vritti/api-sdk/drizzle-orm';
import {
  type InventoryTracking,
  inventoryItems,
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
  supplierQuotationItems,
  supplierQuotations,
  uom,
} from '@/db/schema';

const primaryUom = aliasedTable(uom, 'primary_uom');

export type PurchaseAllocationRow = PurchaseItemAllocation & {
  purchaseOrderId: string | null;
  inventoryItemName: string;
  uomSymbol: string | null;
  quotationNumber: string | null;
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
  uomSymbol: string | null;
  primaryUomSymbol: string | null;
  purchaseOrderId: string | null;
  purchaseOrderStatus: PurchaseOrderStatus | null;
  purchaseOrderCurrencyCode: string | null;
  orderedUomQty: number | null;
  orderedPrimaryUomQty: number | null;
  receivedPrimaryQty: number | null;
};

export type AllocationWithLegFilter = {
  supplierId?: string;
  purchaseSupplierId?: string;
  siteId?: string;
  allocationIds?: string[];
  legTypes?: PurchaseType[];
};

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
      },
      innerJoins: [
        ...this.itemJoins(),
        { table: purchases, on: eq(purchases.id, purchaseItems.purchaseId) },
        { table: purchaseSuppliers, on: eq(purchaseSuppliers.id, purchaseItemAllocations.purchaseSupplierId) },
      ],
      leftJoins: [
        { table: uom, on: eq(uom.id, purchaseItemAllocations.uomId) },
        { table: primaryUom, on: eq(primaryUom.id, inventoryItems.uomId) },
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
    for (const link of links) {
      await this.update(link.allocationId, { purchaseOrderItemId: link.purchaseOrderItemId });
    }
  }

  // Clears the PO line of the allocations that became the given lines
  async unlinkOrderLines(purchaseOrderItemIds: string[]): Promise<void> {
    if (purchaseOrderItemIds.length === 0) return;
    await this.updateMany(inArray(purchaseItemAllocations.purchaseOrderItemId, purchaseOrderItemIds), {
      purchaseOrderItemId: null,
    });
  }

  // Selects an allocation with its PO, item name, unit symbol and the number of the quotation it was awarded from
  private selection() {
    return {
      ...getColumns(purchaseItemAllocations),
      purchaseOrderId: purchaseOrderItems.purchaseOrderId,
      inventoryItemName: inventoryItems.name,
      uomSymbol: uom.symbol,
      quotationNumber: supplierQuotations.quotationNumber,
    };
  }

  // Joins the purchase item the allocation sources and its inventory item
  private itemJoins() {
    return [
      { table: purchaseItems, on: eq(purchaseItems.id, purchaseItemAllocations.purchaseItemId) },
      { table: inventoryItems, on: eq(inventoryItems.id, purchaseItems.inventoryItemId) },
    ];
  }

  // Joins the allocation's unit, the PO line it became and the quotation line it was awarded from, when any
  private termJoins() {
    return [
      { table: uom, on: eq(uom.id, purchaseItemAllocations.uomId) },
      { table: purchaseOrderItems, on: eq(purchaseOrderItems.id, purchaseItemAllocations.purchaseOrderItemId) },
      {
        table: supplierQuotationItems,
        on: eq(supplierQuotationItems.id, purchaseItemAllocations.supplierQuotationItemId),
      },
      { table: supplierQuotations, on: eq(supplierQuotations.id, supplierQuotationItems.quotationId) },
    ];
  }
}
