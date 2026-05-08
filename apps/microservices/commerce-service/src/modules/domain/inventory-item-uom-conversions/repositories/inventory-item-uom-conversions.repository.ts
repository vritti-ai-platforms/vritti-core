import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, asc, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { type InventoryItemUomConversion, inventoryItems, inventoryItemUomConversions, uom } from '@/db/schema';

export type ConversionWithUom = InventoryItemUomConversion & {
  uomName: string | null;
  uomSymbol: string | null;
};

function buildJoinedSelect() {
  return {
    id: inventoryItemUomConversions.id,
    organizationId: inventoryItemUomConversions.organizationId,
    businessUnitId: inventoryItemUomConversions.businessUnitId,
    inventoryItemId: inventoryItemUomConversions.inventoryItemId,
    uomId: inventoryItemUomConversions.uomId,
    numerator: inventoryItemUomConversions.numerator,
    denominator: inventoryItemUomConversions.denominator,
    createdAt: inventoryItemUomConversions.createdAt,
    updatedAt: inventoryItemUomConversions.updatedAt,
    uomName: uom.name,
    uomSymbol: uom.symbol,
  };
}

@Injectable()
export class InventoryItemUomConversionsRepository extends PrimaryBaseRepository<typeof inventoryItemUomConversions> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemUomConversions);
  }

  // Returns paginated, filtered, sorted UOM overrides for an item with joined UOM details
  async findForTable(
    itemId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: ConversionWithUom[]; count: number }> {
    const baseWhere = eq(inventoryItemUomConversions.inventoryItemId, itemId);
    const combinedWhere = options.where ? and(baseWhere, options.where) : baseWhere;

    const { result, count } = await this.findAllAndCount<ConversionWithUom>({
      select: buildJoinedSelect(),
      leftJoins: [{ table: uom, on: eq(inventoryItemUomConversions.uomId, uom.id) }],
      where: combinedWhere,
      orderBy: options.orderBy ?? [asc(inventoryItemUomConversions.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });

    return { result: result as ConversionWithUom[], count };
  }

  // Returns a single UOM conversion by ID with joined UOM details
  async findById(id: string): Promise<ConversionWithUom | undefined> {
    const rows = await this.db
      .select(buildJoinedSelect())
      .from(inventoryItemUomConversions)
      .leftJoin(uom, eq(inventoryItemUomConversions.uomId, uom.id))
      .where(eq(inventoryItemUomConversions.id, id));
    return rows[0] as ConversionWithUom | undefined;
  }

  // Returns an override by composite key (item + UOM) for duplicate detection
  async findByItemAndUom(itemId: string, uomId: string): Promise<InventoryItemUomConversion | undefined> {
    return this.model.findFirst({ where: { inventoryItemId: itemId, uomId } });
  }

  // Returns the primary UOM ID for a given inventory item
  async findItemPrimaryUomId(itemId: string): Promise<string | undefined> {
    const rows = await this.db
      .select({ uomId: inventoryItems.uomId })
      .from(inventoryItems)
      .where(eq(inventoryItems.id, itemId))
      .limit(1);
    return rows[0]?.uomId;
  }
}
