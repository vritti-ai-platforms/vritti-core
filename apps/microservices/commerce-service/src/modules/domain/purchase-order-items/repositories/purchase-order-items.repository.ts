import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { aliasedTable, and, desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItems, type PurchaseOrderItem, purchaseOrderItems, uom } from '@/db/schema';

const orderUom = aliasedTable(uom, 'order_uom');

@Injectable()
export class PurchaseOrderItemsRepository extends PrimaryBaseRepository<typeof purchaseOrderItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, purchaseOrderItems);
  }

  // Returns all line items for a PO with inventory item names, order UOM symbol, and primary UOM symbol
  async findItemsByPoId(
    poId: string,
  ): Promise<(PurchaseOrderItem & { inventoryItemName: string; orderUomSymbol: string | null; primaryUomSymbol: string | null })[]> {
    const rows = await this.db
      .select({
        id: purchaseOrderItems.id,
        organizationId: purchaseOrderItems.organizationId,
        purchaseOrderId: purchaseOrderItems.purchaseOrderId,
        inventoryItemId: purchaseOrderItems.inventoryItemId,
        uomId: purchaseOrderItems.uomId,
        quantity: purchaseOrderItems.quantity,
        receivedQuantity: purchaseOrderItems.receivedQuantity,
        conversionFactor: purchaseOrderItems.conversionFactor,
        primaryUomUnitPrice: purchaseOrderItems.primaryUomUnitPrice,
        supplierUnitPrice: purchaseOrderItems.supplierUnitPrice,
        unitPrice: purchaseOrderItems.unitPrice,
        totalPrice: purchaseOrderItems.totalPrice,
        inventoryItemName: inventoryItems.name,
        orderUomSymbol: orderUom.symbol,
        primaryUomSymbol: uom.symbol,
      })
      .from(purchaseOrderItems)
      .leftJoin(inventoryItems, eq(purchaseOrderItems.inventoryItemId, inventoryItems.id))
      .leftJoin(orderUom, eq(purchaseOrderItems.uomId, orderUom.id))
      .leftJoin(uom, eq(inventoryItems.uomId, uom.id))
      .where(eq(purchaseOrderItems.purchaseOrderId, poId));

    return rows as (PurchaseOrderItem & { inventoryItemName: string; orderUomSymbol: string | null; primaryUomSymbol: string | null })[];
  }

  // Returns inventory item IDs linked to a PO
  async findItemIdsByPoId(poId: string): Promise<string[]> {
    const rows = await this.db
      .select({ inventoryItemId: purchaseOrderItems.inventoryItemId })
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, poId));

    return rows.map((row) => row.inventoryItemId);
  }

  // Returns paginated PO line items for table view
  async findItemsForTable(
    poId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: (PurchaseOrderItem & { inventoryItemName: string; orderUomSymbol: string | null; primaryUomSymbol: string | null })[]; count: number }> {
    const baseWhere = eq(purchaseOrderItems.purchaseOrderId, poId);
    const where = options.where ? and(baseWhere, options.where) : baseWhere;
    return this.findAllAndCount<
      PurchaseOrderItem & {
        inventoryItemName: string;
        orderUomSymbol: string | null;
        primaryUomSymbol: string | null;
      }
    >({
      select: {
        id: purchaseOrderItems.id,
        organizationId: purchaseOrderItems.organizationId,
        purchaseOrderId: purchaseOrderItems.purchaseOrderId,
        inventoryItemId: purchaseOrderItems.inventoryItemId,
        uomId: purchaseOrderItems.uomId,
        quantity: purchaseOrderItems.quantity,
        receivedQuantity: purchaseOrderItems.receivedQuantity,
        conversionFactor: purchaseOrderItems.conversionFactor,
        primaryUomUnitPrice: purchaseOrderItems.primaryUomUnitPrice,
        supplierUnitPrice: purchaseOrderItems.supplierUnitPrice,
        unitPrice: purchaseOrderItems.unitPrice,
        totalPrice: purchaseOrderItems.totalPrice,
        inventoryItemName: inventoryItems.name,
        orderUomSymbol: orderUom.symbol,
        primaryUomSymbol: uom.symbol,
      },
      leftJoins: [
        { table: inventoryItems, on: eq(purchaseOrderItems.inventoryItemId, inventoryItems.id) },
        { table: orderUom, on: eq(purchaseOrderItems.uomId, orderUom.id) },
        { table: uom, on: eq(inventoryItems.uomId, uom.id) },
      ],
      where,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(purchaseOrderItems.inventoryItemId)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Finds one PO line item by PO ID and item ID
  async findItemById(poId: string, itemId: string): Promise<PurchaseOrderItem | null> {
    const [item] = await this.db
      .select()
      .from(purchaseOrderItems)
      .where(and(eq(purchaseOrderItems.purchaseOrderId, poId), eq(purchaseOrderItems.id, itemId)));
    return (item as PurchaseOrderItem | undefined) ?? null;
  }

  // Finds one PO line item by PO ID and inventory item ID
  async findItemByInventoryItemId(poId: string, inventoryItemId: string): Promise<PurchaseOrderItem | null> {
    const [item] = await this.db
      .select()
      .from(purchaseOrderItems)
      .where(
        and(eq(purchaseOrderItems.purchaseOrderId, poId), eq(purchaseOrderItems.inventoryItemId, inventoryItemId)),
      );
    return (item as PurchaseOrderItem | undefined) ?? null;
  }

  // Updates pricing fields for a PO line item
  async updateLinePricing(itemId: string, data: { unitPrice: bigint; totalPrice: bigint }): Promise<void> {
    await this.db
      .update(purchaseOrderItems)
      .set({
        unitPrice: data.unitPrice,
        totalPrice: data.totalPrice,
      })
      .where(eq(purchaseOrderItems.id, itemId));
  }

  // Recalculates unit, total, and primary-UOM unit prices for all items on a PO using the header conversion rate and scale factor
  async recalculateAllForPo(poId: string, conversionRate: number, scaleFactor: number): Promise<void> {
    await this.db
      .update(purchaseOrderItems)
      .set({
        unitPrice: sql`ROUND(${purchaseOrderItems.supplierUnitPrice}::numeric * ${conversionRate} * ${scaleFactor})::bigint`,
        totalPrice: sql`ROUND(${purchaseOrderItems.quantity}::numeric * ROUND(${purchaseOrderItems.supplierUnitPrice}::numeric * ${conversionRate} * ${scaleFactor}))::bigint`,
        primaryUomUnitPrice: sql`ROUND(ROUND(${purchaseOrderItems.supplierUnitPrice}::numeric * ${conversionRate} * ${scaleFactor}) / ${purchaseOrderItems.conversionFactor}::numeric)::bigint`,
      })
      .where(eq(purchaseOrderItems.purchaseOrderId, poId));
  }
}
