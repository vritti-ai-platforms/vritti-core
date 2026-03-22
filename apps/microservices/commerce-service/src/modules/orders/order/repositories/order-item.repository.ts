import { Injectable } from '@nestjs/common';
import { type TypedDrizzleClient, PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, eq, inArray, isNotNull, ne, sql } from '@vritti/api-sdk/drizzle-orm';
import { type OrderItem, orderItems, orders, stations } from '@/db/schema';

@Injectable()
export class OrderItemRepository extends PrimaryBaseRepository<typeof orderItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, orderItems);
  }

  // Finds all items belonging to an order
  async findByOrderId(orderId: string): Promise<OrderItem[]> {
    return this.model.findMany({
      where: { orderId },
    });
  }

  // Finds active KOT items (PENDING or PREPARING) with station assignment for an org+bu
  async findActiveByStation(orgId: string, buId: string) {
    return this.db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        name: orderItems.name,
        quantity: orderItems.quantity,
        notes: orderItems.notes,
        kotNumber: orderItems.kotNumber,
        status: orderItems.status,
        stationId: orderItems.stationId,
        stationName: stations.name,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(stations, eq(orderItems.stationId, stations.id))
      .where(
        and(
          eq(orders.organizationId, orgId),
          eq(orders.businessUnitId, buId),
          inArray(orderItems.status, ['PENDING', 'PREPARING']),
          isNotNull(orderItems.stationId),
        ),
      )
      .orderBy(orderItems.kotNumber, orderItems.createdAt);
  }

  // Returns the maximum KOT number assigned to items in an order
  async getMaxKotNumber(orderId: string): Promise<number> {
    const result = await this.db
      .select({ max: sql<number>`coalesce(max(${orderItems.kotNumber}), 0)` })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
    return Number(result[0]?.max ?? 0);
  }

  // Inserts multiple order items within an optional transaction
  async createManyInTx(data: (typeof orderItems.$inferInsert)[], tx?: TypedDrizzleClient): Promise<OrderItem[]> {
    const db = tx ?? this.db;
    const rows = await db.insert(orderItems).values(data).returning();
    return rows as OrderItem[];
  }

  // Counts items for an order that are not in a terminal status
  async countNonReadyItems(orderId: string, excludeItemId?: string): Promise<number> {
    let condition = and(
      eq(orderItems.orderId, orderId),
      inArray(orderItems.status, ['PENDING', 'PREPARING']),
    );

    if (excludeItemId) {
      condition = and(condition, ne(orderItems.id, excludeItemId));
    }

    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(orderItems)
      .where(condition);
    return (result[0] as { count: number }).count;
  }
}
