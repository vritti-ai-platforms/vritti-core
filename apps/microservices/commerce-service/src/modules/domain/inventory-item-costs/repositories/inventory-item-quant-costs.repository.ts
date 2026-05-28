import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, eq, inArray, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type InventoryItemQuantCost,
  inventoryItemLots,
  inventoryItemQuantCosts,
  inventoryItemQuants,
  locations,
} from '@/db/schema';

export interface AllocationRow {
  quantId: string;
  locationId: string;
  locationName: string | null;
  lotId: string | null;
  lotNumber: string | null;
  quantity: number;
  allocatedAmount: bigint;
}

@Injectable()
export class InventoryItemQuantCostsRepository extends PrimaryBaseRepository<typeof inventoryItemQuantCosts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemQuantCosts);
  }

  async findByQuantId(quantId: string): Promise<InventoryItemQuantCost[]> {
    const rows = await this.db
      .select()
      .from(inventoryItemQuantCosts)
      .where(eq(inventoryItemQuantCosts.quantId, quantId));
    return rows as InventoryItemQuantCost[];
  }

  async findByCostId(costId: string): Promise<InventoryItemQuantCost[]> {
    const rows = await this.db
      .select()
      .from(inventoryItemQuantCosts)
      .where(eq(inventoryItemQuantCosts.costId, costId));
    return rows as InventoryItemQuantCost[];
  }

  // For row-expand on the Costs tab: lists each quant the cost row touches, with location + lot
  // labels so the user can see WHERE the cost landed.
  async findAllocationsForCost(costId: string): Promise<AllocationRow[]> {
    const rows = await this.db
      .select({
        quantId: inventoryItemQuantCosts.quantId,
        locationId: inventoryItemQuants.locationId,
        locationName: locations.name,
        lotId: inventoryItemQuants.lotId,
        lotNumber: inventoryItemLots.lotNumber,
        quantity: inventoryItemQuants.quantity,
        allocatedAmount: inventoryItemQuantCosts.allocatedAmount,
      })
      .from(inventoryItemQuantCosts)
      .innerJoin(inventoryItemQuants, eq(inventoryItemQuantCosts.quantId, inventoryItemQuants.id))
      .leftJoin(locations, eq(inventoryItemQuants.locationId, locations.id))
      .leftJoin(inventoryItemLots, eq(inventoryItemQuants.lotId, inventoryItemLots.id))
      .where(eq(inventoryItemQuantCosts.costId, costId));
    return rows.map((r) => ({ ...r, allocatedAmount: BigInt(r.allocatedAmount as unknown as string) }));
  }

  async createMany(
    rows: { quantId: string; costId: string; allocatedAmount: bigint }[],
  ): Promise<InventoryItemQuantCost[]> {
    if (rows.length === 0) return [];
    const inserted = await this.db.insert(inventoryItemQuantCosts).values(rows).returning();
    return inserted as InventoryItemQuantCost[];
  }

  async deleteByCostId(costId: string): Promise<void> {
    await this.db.delete(inventoryItemQuantCosts).where(eq(inventoryItemQuantCosts.costId, costId));
  }

  // SUM of allocatedAmount per quant across all junction rows for a given set of quants.
  // Used by the recompute-quant-total-unit-cost path.
  async sumAllocatedByQuantIds(quantIds: string[]): Promise<Map<string, bigint>> {
    if (quantIds.length === 0) return new Map();
    const rows = await this.db
      .select({
        quantId: inventoryItemQuantCosts.quantId,
        sum: sql<string>`SUM(${inventoryItemQuantCosts.allocatedAmount})::text`,
      })
      .from(inventoryItemQuantCosts)
      .where(inArray(inventoryItemQuantCosts.quantId, quantIds))
      .groupBy(inventoryItemQuantCosts.quantId);
    const map = new Map<string, bigint>();
    for (const r of rows) map.set(r.quantId, BigInt(r.sum ?? '0'));
    return map;
  }
}
