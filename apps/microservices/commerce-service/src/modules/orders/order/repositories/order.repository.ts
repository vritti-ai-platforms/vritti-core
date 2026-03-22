import { Injectable } from '@nestjs/common';
import { type TypedDrizzleClient, PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, eq, sql } from '@vritti/api-sdk/drizzle-orm';
import { type Order, type OrderSource, type OrderStatus, orders } from '@/db/schema';

@Injectable()
export class OrderRepository extends PrimaryBaseRepository<typeof orders> {
  constructor(database: PrimaryDatabaseService) {
    super(database, orders);
  }

  // Finds orders for an org+bu with optional status and source filters
  async findByOrgAndBu(
    orgId: string,
    buId: string,
    filters?: { status?: OrderStatus; source?: OrderSource },
  ): Promise<Order[]> {
    const conditions = [eq(orders.organizationId, orgId), eq(orders.businessUnitId, buId)];

    if (filters?.status) {
      conditions.push(eq(orders.status, filters.status));
    }
    if (filters?.source) {
      conditions.push(eq(orders.source, filters.source));
    }

    const rows = await this.db.select().from(orders).where(and(...conditions)).orderBy(orders.createdAt);
    return rows as Order[];
  }

  // Generates a sequential order number for an org+bu
  async generateOrderNumber(orgId: string, buId: string): Promise<string> {
    const count = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(eq(orders.organizationId, orgId), eq(orders.businessUnitId, buId)));
    return `ORD-${String(Number(count[0]?.count ?? 0) + 1).padStart(4, '0')}`;
  }

  // Creates an order within an optional transaction
  async createInTx(data: typeof orders.$inferInsert, tx?: TypedDrizzleClient): Promise<Order> {
    const db = tx ?? this.db;
    const rows = await db.insert(orders).values(data).returning();
    return rows[0] as Order;
  }
}
