import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { asc, eq } from '@vritti/api-sdk/drizzle-orm';
import { type Checkout, type CheckoutLine, checkoutLines, checkouts, type NewCheckoutLine, orders } from '@/db/schema';
import type { CheckoutOrderRefDto } from '../dto/entity/checkout.dto';

@Injectable()
export class CheckoutsDomainRepository extends PrimaryBaseRepository<typeof checkouts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, checkouts);
  }

  // The checkout a party's storefront already opened under this key, if any
  async findByKey(partyId: string, checkoutKey: string): Promise<Checkout | undefined> {
    return this.model.findFirst({ where: { partyId, checkoutKey } });
  }

  // Loads a checkout and locks its row until the surrounding transaction ends, so concurrent payment callbacks
  // serialize
  async findByIdForUpdate(id: string): Promise<Checkout | undefined> {
    const [row] = await this.db.select().from(checkouts).where(eq(checkouts.id, id)).limit(1).for('update');
    return row;
  }

  async createLines(data: NewCheckoutLine[]): Promise<CheckoutLine[]> {
    if (data.length === 0) return [];
    return this.db.insert(checkoutLines).values(data).returning() as Promise<CheckoutLine[]>;
  }

  // The lines as they were frozen, in the order they were added
  async findLines(checkoutId: string): Promise<CheckoutLine[]> {
    return this.db
      .select()
      .from(checkoutLines)
      .where(eq(checkoutLines.checkoutId, checkoutId))
      .orderBy(asc(checkoutLines.createdAt));
  }

  // The orders a checkout became, one per store
  async findOrders(checkoutId: string): Promise<CheckoutOrderRefDto[]> {
    return this.db
      .select({ siteId: orders.siteId, orderId: orders.id, orderNumber: orders.orderNumber })
      .from(orders)
      .where(eq(orders.checkoutId, checkoutId))
      .orderBy(asc(orders.createdAt));
  }
}
