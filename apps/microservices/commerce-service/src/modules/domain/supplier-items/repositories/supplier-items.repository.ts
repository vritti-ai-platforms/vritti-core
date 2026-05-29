import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk';
import { and, asc, desc, eq, ilike, inArray, ne, sql, type SQL } from '@vritti/api-sdk/drizzle-orm';
import {
  categories,
  goodsReceiptItems,
  inventoryItems,
  type NewSupplierItem,
  purchaseOrderItems,
  type Supplier,
  type SupplierItem,
  supplierItems,
  suppliers,
  uom,
} from '@/db/schema';

@Injectable()
export class SupplierItemsRepository extends PrimaryBaseRepository<typeof supplierItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, supplierItems);
  }

  // Returns paginated supplier item options — one row per (inventoryItem, uom) pair.
  // Identity is `supplier_items.id`; the inventory item's name is the display label.
  // When supplierId is absent, returns all active supplier items and includes the supplier name as description.
  // When purchaseOrderId is supplied, restricts to supplier items whose (inventoryItemId, uomId) matches a line
  //   on that PO (include-only — used by the GR add-item flow when PO is linked).
  // When excludeOnPurchaseOrderId is supplied, excludes supplier items already on that PO (used by the PO add-line dialog).
  // When excludeOnGoodsReceiptId is supplied, excludes supplier items whose (inventoryItemId, uomId) is already on that GR.
  // The LEFT JOIN to purchase_order_items surfaces the negotiated PO line price on `additionals` when
  // purchaseOrderId is provided — used by the GR AddItem dialog to pre-fill the unit-price field.
  findForSelect(
    config: FindForSelectConfig,
    options?: {
      supplierId?: string;
      purchaseOrderId?: string;
      excludeOnPurchaseOrderId?: string;
      excludeOnGoodsReceiptId?: string;
    },
  ): Promise<SelectQueryResult> {
    const conditions: SQL[] = [eq(supplierItems.isActive, true)];

    if (options?.supplierId) {
      conditions.push(eq(supplierItems.supplierId, options.supplierId));
    }

    if (options?.purchaseOrderId) {
      const poId = options.purchaseOrderId;
      conditions.push(sql`EXISTS (
        SELECT 1 FROM ${purchaseOrderItems} poi
        WHERE poi.purchase_order_id = ${poId}
          AND poi.inventory_item_id = ${inventoryItems.id}
          AND poi.uom_id = ${supplierItems.uomId}
      )`);
    }

    if (options?.excludeOnPurchaseOrderId) {
      const poId = options.excludeOnPurchaseOrderId;
      conditions.push(sql`NOT EXISTS (
        SELECT 1 FROM ${purchaseOrderItems} poi
        WHERE poi.purchase_order_id = ${poId}
          AND poi.inventory_item_id = ${inventoryItems.id}
          AND poi.uom_id = ${supplierItems.uomId}
      )`);
    }

    if (options?.excludeOnGoodsReceiptId) {
      const grId = options.excludeOnGoodsReceiptId;
      conditions.push(sql`NOT EXISTS (
        SELECT 1 FROM ${goodsReceiptItems} gri
        WHERE gri.goods_receipt_id = ${grId}
          AND gri.inventory_item_id = ${inventoryItems.id}
          AND gri.uom_id = ${supplierItems.uomId}
      )`);
    }

    const limit = Number(config.limit) || 20;
    const offset = Number(config.offset) || 0;
    const search = config.search?.trim();

    if (search) {
      conditions.push(ilike(inventoryItems.name, `%${search}%`));
    }

    const baseSelect = {
      value: supplierItems.id,
      label: inventoryItems.name,
      groupId: inventoryItems.categoryId,
      groupName: categories.name,
      supplierName: suppliers.name,
      symbol: uom.symbol,
      inventoryItemId: inventoryItems.id,
      uomId: supplierItems.uomId,
      unitPrice: supplierItems.unitPrice,
      currencyCode: supplierItems.currencyCode,
      allowDecimal: uom.allowDecimal,
      poUnitPrice: purchaseOrderItems.unitPrice,
      poPrimaryUomUnitPrice: purchaseOrderItems.primaryUomUnitPrice,
      poCurrencyCode: purchaseOrderItems.currencyCode,
    };

    // Always LEFT JOIN purchase_order_items. When `options.purchaseOrderId` is undefined we pass a sentinel
    // that can't match any row (`purchase_order_id` is NOT NULL on the table) so the po-side columns
    // resolve to NULL; the projection shape stays stable for the response mapper.
    const poIdForJoin = options?.purchaseOrderId ?? '00000000-0000-0000-0000-000000000000';

    return this.db
      .select(baseSelect)
      .from(supplierItems)
      .innerJoin(inventoryItems, eq(inventoryItems.id, supplierItems.inventoryItemId))
      .innerJoin(suppliers, eq(suppliers.id, supplierItems.supplierId))
      .leftJoin(categories, eq(categories.id, inventoryItems.categoryId))
      .leftJoin(uom, eq(uom.id, supplierItems.uomId))
      .leftJoin(
        purchaseOrderItems,
        and(
          eq(purchaseOrderItems.purchaseOrderId, poIdForJoin),
          eq(purchaseOrderItems.inventoryItemId, inventoryItems.id),
          eq(purchaseOrderItems.uomId, supplierItems.uomId),
        ) as SQL,
      )
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(asc(categories.id), asc(inventoryItems.name))
      .limit(limit)
      .offset(offset)
      .then((rows) => {
        const seenGroups = new Map<string, string>();
        for (const row of rows) {
          if (row.groupId != null && row.groupName != null && !seenGroups.has(row.groupId)) {
            seenGroups.set(row.groupId, row.groupName);
          }
        }
        return {
          options: rows.map((row) => ({
            value: row.value,
            label: row.label,
            ...(row.groupId != null ? { groupId: row.groupId } : {}),
            ...(!options?.supplierId ? { description: row.supplierName } : {}),
            additionals: {
              symbol: row.symbol,
              inventoryItemId: row.inventoryItemId,
              uomId: row.uomId,
              unitPrice: row.unitPrice !== null ? Number(row.unitPrice) : null,
              currencyCode: row.currencyCode,
              allowDecimal: row.allowDecimal,
              poUnitPrice:
                row.poUnitPrice !== null && row.poUnitPrice !== undefined ? Number(row.poUnitPrice) : null,
              poPrimaryUomUnitPrice:
                row.poPrimaryUomUnitPrice !== null && row.poPrimaryUomUnitPrice !== undefined
                  ? Number(row.poPrimaryUomUnitPrice)
                  : null,
              poCurrencyCode: row.poCurrencyCode ?? null,
            },
          })),
          groups: Array.from(seenGroups.entries()).map(([id, name]) => ({ id, name })),
          hasMore: false,
        };
      });
  }

  async findSupplierById(id: string): Promise<Supplier | undefined> {
    const [row] = await this.db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    return row as Supplier | undefined;
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

  // Bulk-deletes supplier item links by IDs
  async bulkDeleteSupplierItems(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.db.delete(supplierItems).where(inArray(supplierItems.id, ids));
  }

  // Finds a supplier item by ID with inventory item name and UOM symbol
  async findSupplierItemById(
    id: string,
  ): Promise<(SupplierItem & { inventoryItemName: string; uomSymbol: string }) | undefined> {
    const [row] = await this.db
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

    return row as (SupplierItem & { inventoryItemName: string; uomSymbol: string }) | undefined;
  }

  async findById(id: string): Promise<SupplierItem | undefined> {
    const [row] = await this.db.select().from(supplierItems).where(eq(supplierItems.id, id)).limit(1);
    return row as SupplierItem | undefined;
  }

  async findItemBySupplierInventoryItemAndUom(
    supplierId: string,
    inventoryItemId: string,
    uomId: string,
  ): Promise<SupplierItem | undefined> {
    const [row] = await this.db
      .select()
      .from(supplierItems)
      .where(
        and(
          eq(supplierItems.supplierId, supplierId),
          eq(supplierItems.inventoryItemId, inventoryItemId),
          eq(supplierItems.uomId, uomId),
        ),
      )
      .limit(1);
    return row as SupplierItem | undefined;
  }

  async findUomSymbol(uomId: string): Promise<string | null> {
    const [row] = await this.db.select({ symbol: uom.symbol }).from(uom).where(eq(uom.id, uomId)).limit(1);
    return row?.symbol ?? null;
  }

  // Bulk-updates currency and reprices all supplier items for a supplier using the given conversion rate
  async recalculateAllForSupplier(supplierId: string, newCurrencyCode: string, conversionRate: number): Promise<void> {
    await this.db
      .update(supplierItems)
      .set({
        currencyCode: newCurrencyCode,
        unitPrice: sql`ROUND(${supplierItems.unitPrice}::numeric * ${conversionRate})::bigint`,
      })
      .where(eq(supplierItems.supplierId, supplierId));
  }
}
