import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type NewOrderItem,
  type OrderItem,
  offerings,
  offeringVariants,
  orderItems,
  orderNumberSeq,
  orders,
  taxRates,
} from '@/db/schema';

@Injectable()
export class OrdersDomainRepository extends PrimaryBaseRepository<typeof orders> {
  constructor(database: PrimaryDatabaseService) {
    super(database, orders, { sequence: orderNumberSeq });
  }

  // Returns all line items for an order
  async findItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    return this.db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  // Creates multiple order line items
  async createItems(data: NewOrderItem[]): Promise<OrderItem[]> {
    if (data.length === 0) return [];
    return this.db.insert(orderItems).values(data).returning() as Promise<OrderItem[]>;
  }

  // Generates a sequential order number (RLS scopes the count to current site)
  async generateOrderNumber(): Promise<string> {
    const nextNumber = await this.nextSequenceValue();
    return `ORD-${String(nextNumber).padStart(5, '0')}`;
  }

  // Looks up variant details with offering info for denormalization during order creation
  async findVariantWithOffering(variantId: string): Promise<
    | {
        offeringId: string;
        offeringName: string;
        variantName: string;
        taxClassId: string;
      }
    | undefined
  > {
    const [row] = await this.db
      .select({
        offeringId: offerings.id,
        offeringName: offerings.name,
        variantName: offeringVariants.name,
        taxClassId: offeringVariants.taxClassId,
      })
      .from(offeringVariants)
      .innerJoin(offerings, eq(offeringVariants.offeringId, offerings.id))
      .where(eq(offeringVariants.id, variantId));
    return row;
  }

  // Returns the effective tax rate for a tax group (sum of all component rates)
  async getEffectiveTaxRate(taxGroupId: string | null): Promise<number> {
    if (!taxGroupId) return 0;
    const result = await this.db
      .select({ total: sql<number>`coalesce(sum(${taxRates.rate}), 0)` })
      .from(taxRates)
      .where(eq(taxRates.taxGroupId, taxGroupId));
    return Number(result[0]?.total ?? 0);
  }
}
