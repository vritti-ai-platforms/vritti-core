import { Injectable } from '@nestjs/common';
import { type FindForSelectConfig, PrimaryBaseRepository, PrimaryDatabaseService, type SelectQueryResult } from '@vritti/api-sdk';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import { type Bom, type BomLine, type NewBomLine, bom, bomLines, inventoryItems } from '@/db/schema';

@Injectable()
export class BomRepository extends PrimaryBaseRepository<typeof bom> {
  constructor(database: PrimaryDatabaseService) {
    super(database, bom);
  }

  // Returns paginated BOM options for the select component
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Returns all lines for a BOM with inventory item names
  async findLinesByBomId(bomId: string): Promise<(BomLine & { inventoryItemName: string | null })[]> {
    const rows = await this.db
      .select({
        id: bomLines.id,
        organizationId: bomLines.organizationId,
        bomId: bomLines.bomId,
        inventoryItemId: bomLines.inventoryItemId,
        requiredQuantity: bomLines.requiredQuantity,
        inventoryItemName: inventoryItems.name,
      })
      .from(bomLines)
      .leftJoin(inventoryItems, eq(bomLines.inventoryItemId, inventoryItems.id))
      .where(eq(bomLines.bomId, bomId));

    return rows as (BomLine & { inventoryItemName: string | null })[];
  }

  // Creates multiple BOM lines
  async createLines(lines: NewBomLine[]): Promise<BomLine[]> {
    if (lines.length === 0) return [];
    return this.db.insert(bomLines).values(lines).returning() as Promise<BomLine[]>;
  }

  // Deletes all lines for a BOM
  async deleteLinesByBomId(bomId: string): Promise<void> {
    await this.db.delete(bomLines).where(eq(bomLines.bomId, bomId));
  }
}
