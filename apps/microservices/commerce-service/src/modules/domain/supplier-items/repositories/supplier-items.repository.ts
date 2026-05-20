import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, desc, eq, ne, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItems, type NewSupplierItem, type SupplierItem, supplierItems, suppliers, uom } from '@/db/schema';

@Injectable()
export class SupplierItemsRepository extends PrimaryBaseRepository<typeof supplierItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, supplierItems);
  }

  async findSupplierById(id: string): Promise<typeof suppliers.$inferSelect | undefined> {
    const rows = await this.db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    return rows[0] as typeof suppliers.$inferSelect | undefined;
  }

  // Returns paginated supplier items for a supplier with joined item/UOM display fields
  async findItemsForTable(
    supplierId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: (SupplierItem & { inventoryItemName: string; uomSymbol: string })[]; count: number }> {
    const baseWhere = eq(supplierItems.supplierId, supplierId);
    const where = options.where ? and(baseWhere, options.where) : baseWhere;
    return this.findAllAndCount<SupplierItem & { inventoryItemName: string; uomSymbol: string }>({
      select: {
        id: supplierItems.id,
        organizationId: supplierItems.organizationId,
        supplierId: supplierItems.supplierId,
        inventoryItemId: supplierItems.inventoryItemId,
        supplierItemCode: supplierItems.supplierItemCode,
        unitPrice: supplierItems.unitPrice,
        currencyCode: supplierItems.currencyCode,
        uomId: supplierItems.uomId,
        minOrderQuantity: supplierItems.minOrderQuantity,
        leadTimeDays: supplierItems.leadTimeDays,
        isPreferred: supplierItems.isPreferred,
        isActive: supplierItems.isActive,
        createdAt: supplierItems.createdAt,
        updatedAt: supplierItems.updatedAt,
        inventoryItemName: inventoryItems.name,
        uomSymbol: uom.symbol,
      },
      leftJoins: [
        { table: inventoryItems, on: eq(supplierItems.inventoryItemId, inventoryItems.id) },
        { table: uom, on: eq(supplierItems.uomId, uom.id) },
      ],
      where,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(supplierItems.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns paginated supplier items for an inventory item with joined supplier name/code and UOM symbol
  async findSuppliersForItem(
    inventoryItemId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{
    result: (SupplierItem & { supplierName: string; supplierCode: string; uomSymbol: string })[];
    count: number;
  }> {
    const baseWhere = eq(supplierItems.inventoryItemId, inventoryItemId);
    const where = options.where ? and(baseWhere, options.where) : baseWhere;
    return this.findAllAndCount<SupplierItem & { supplierName: string; supplierCode: string; uomSymbol: string }>({
      select: {
        id: supplierItems.id,
        organizationId: supplierItems.organizationId,
        supplierId: supplierItems.supplierId,
        inventoryItemId: supplierItems.inventoryItemId,
        supplierItemCode: supplierItems.supplierItemCode,
        unitPrice: supplierItems.unitPrice,
        currencyCode: supplierItems.currencyCode,
        uomId: supplierItems.uomId,
        minOrderQuantity: supplierItems.minOrderQuantity,
        leadTimeDays: supplierItems.leadTimeDays,
        isPreferred: supplierItems.isPreferred,
        isActive: supplierItems.isActive,
        createdAt: supplierItems.createdAt,
        updatedAt: supplierItems.updatedAt,
        supplierName: suppliers.name,
        supplierCode: suppliers.code,
        uomSymbol: uom.symbol,
      },
      leftJoins: [
        { table: suppliers, on: eq(supplierItems.supplierId, suppliers.id) },
        { table: uom, on: eq(supplierItems.uomId, uom.id) },
      ],
      where,
      orderBy: options.orderBy?.length
        ? options.orderBy
        : [desc(supplierItems.isPreferred), desc(supplierItems.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns linked inventory item IDs for a supplier
  async findItemIdsBySupplierId(supplierId: string): Promise<string[]> {
    const rows = await this.db
      .select({ inventoryItemId: supplierItems.inventoryItemId })
      .from(supplierItems)
      .where(eq(supplierItems.supplierId, supplierId));
    return rows.map((row) => row.inventoryItemId);
  }

  // Creates a supplier item link
  async createSupplierItem(data: NewSupplierItem): Promise<SupplierItem> {
    const [row] = await this.db.insert(supplierItems).values(data).returning();
    return row as SupplierItem;
  }

  // Updates a supplier item link by ID
  async updateSupplierItem(id: string, data: Partial<NewSupplierItem>): Promise<SupplierItem> {
    const [row] = await this.db.update(supplierItems).set(data).where(eq(supplierItems.id, id)).returning();
    return row as SupplierItem;
  }

  // Clears is_preferred on all supplier_items for an inventory item except the given row.
  // Used to enforce at-most-one preferred supplier per item before flipping a new one to preferred.
  async clearPreferredForOtherSuppliers(inventoryItemId: string, exceptSupplierItemId?: string): Promise<void> {
    const where = exceptSupplierItemId
      ? and(eq(supplierItems.inventoryItemId, inventoryItemId), ne(supplierItems.id, exceptSupplierItemId))
      : eq(supplierItems.inventoryItemId, inventoryItemId);
    await this.db.update(supplierItems).set({ isPreferred: false }).where(where);
  }

  // Deletes a supplier item link by ID
  async deleteSupplierItem(id: string): Promise<void> {
    await this.db.delete(supplierItems).where(eq(supplierItems.id, id));
  }

  // Finds a supplier item by ID with inventory item name and UOM symbol
  async findSupplierItemById(
    id: string,
  ): Promise<(SupplierItem & { inventoryItemName: string; uomSymbol: string }) | undefined> {
    const rows = await this.db
      .select({
        id: supplierItems.id,
        organizationId: supplierItems.organizationId,
        supplierId: supplierItems.supplierId,
        inventoryItemId: supplierItems.inventoryItemId,
        supplierItemCode: supplierItems.supplierItemCode,
        unitPrice: supplierItems.unitPrice,
        currencyCode: supplierItems.currencyCode,
        uomId: supplierItems.uomId,
        minOrderQuantity: supplierItems.minOrderQuantity,
        leadTimeDays: supplierItems.leadTimeDays,
        isPreferred: supplierItems.isPreferred,
        isActive: supplierItems.isActive,
        createdAt: supplierItems.createdAt,
        updatedAt: supplierItems.updatedAt,
        inventoryItemName: inventoryItems.name,
        uomSymbol: uom.symbol,
      })
      .from(supplierItems)
      .leftJoin(inventoryItems, eq(supplierItems.inventoryItemId, inventoryItems.id))
      .leftJoin(uom, eq(supplierItems.uomId, uom.id))
      .where(eq(supplierItems.id, id))
      .limit(1);

    return rows[0] as (SupplierItem & { inventoryItemName: string; uomSymbol: string }) | undefined;
  }

  // Finds a supplier item by supplier ID and inventory item ID
  async findItemBySupplierAndInventoryItem(
    supplierId: string,
    inventoryItemId: string,
  ): Promise<SupplierItem | undefined> {
    const result = await this.db
      .select()
      .from(supplierItems)
      .where(and(eq(supplierItems.supplierId, supplierId), eq(supplierItems.inventoryItemId, inventoryItemId)))
      .limit(1);
    return result[0] as SupplierItem | undefined;
  }
}
