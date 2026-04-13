import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItems, type NewSupplierItem, type SupplierItem, supplierItems, suppliers, uom } from '@/db/schema';

@Injectable()
export class SuppliersRepository extends PrimaryBaseRepository<typeof suppliers> {
  constructor(database: PrimaryDatabaseService) {
    super(database, suppliers);
  }

  // Returns paginated supplier options for the select component
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Returns all supplier items for a supplier with inventory item names and UOM symbols
  async findItemsBySupplierId(
    supplierId: string,
  ): Promise<(SupplierItem & { inventoryItemName: string | null; uomSymbol: string | null })[]> {
    const rows = await this.db
      .select({
        id: supplierItems.id,
        organizationId: supplierItems.organizationId,
        supplierId: supplierItems.supplierId,
        inventoryItemId: supplierItems.inventoryItemId,
        supplierCode: supplierItems.supplierCode,
        unitPrice: supplierItems.unitPrice,
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
      .where(eq(supplierItems.supplierId, supplierId));

    return rows as (SupplierItem & { inventoryItemName: string | null; uomSymbol: string | null })[];
  }

  // Creates a supplier item link
  async createSupplierItem(data: NewSupplierItem): Promise<SupplierItem> {
    const results = await this.db.insert(supplierItems).values(data).returning();
    return results[0] as SupplierItem;
  }

  // Deletes a supplier item link by ID
  async deleteSupplierItem(id: string): Promise<void> {
    await this.db.delete(supplierItems).where(eq(supplierItems.id, id));
  }
}
