import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { eq, inArray, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  items,
  itemVariants,
  type NewOrderItem,
  type NewOrderItemModifier,
  type OrderItem,
  type OrderItemModifier,
  orderItemModifiers,
  orderItems,
  orderNumberSeq,
  orders,
  taxRates,
} from '@/db/schema';

@Injectable()
export class OrdersRepository extends PrimaryBaseRepository<typeof orders> {
  constructor(database: PrimaryDatabaseService) {
    super(database, orders, { sequence: orderNumberSeq });
  }

  // Returns all line items for an order
  async findItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    return this.db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  // Returns all modifiers for an order item
  async findModifiersByOrderItemId(orderItemId: string): Promise<OrderItemModifier[]> {
    return this.db.select().from(orderItemModifiers).where(eq(orderItemModifiers.orderItemId, orderItemId));
  }

  // Returns all modifiers for multiple order items at once
  async findModifiersByOrderItemIds(orderItemIds: string[]): Promise<OrderItemModifier[]> {
    if (orderItemIds.length === 0) return [];
    return this.db.select().from(orderItemModifiers).where(inArray(orderItemModifiers.orderItemId, orderItemIds));
  }

  // Creates multiple order line items
  async createItems(data: NewOrderItem[]): Promise<OrderItem[]> {
    if (data.length === 0) return [];
    return this.db.insert(orderItems).values(data).returning() as Promise<OrderItem[]>;
  }

  // Creates multiple order item modifiers
  async createModifiers(data: NewOrderItemModifier[]): Promise<OrderItemModifier[]> {
    if (data.length === 0) return [];
    return this.db.insert(orderItemModifiers).values(data).returning() as Promise<OrderItemModifier[]>;
  }

  // Generates a sequential order number (RLS scopes the count to current BU)
  async generateOrderNumber(): Promise<string> {
    const nextNumber = await this.nextSequenceValue();
    return `ORD-${String(nextNumber).padStart(5, '0')}`;
  }

  // Looks up variant details with item info for denormalization during order creation
  async findVariantWithItem(variantId: string): Promise<
    | {
        itemId: string;
        itemName: string;
        variantName: string;
        price: bigint;
        taxGroupId: string | null;
      }
    | undefined
  > {
    const rows = await this.db
      .select({
        itemId: items.id,
        itemName: items.name,
        variantName: itemVariants.name,
        price: itemVariants.price,
        taxGroupId: items.taxGroupId,
      })
      .from(itemVariants)
      .innerJoin(items, eq(itemVariants.itemId, items.id))
      .where(eq(itemVariants.id, variantId));
    return rows[0];
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
