import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq, inArray, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  modifierOptions,
  type NewOrderItem,
  type NewOrderItemModifier,
  type OrderItem,
  type OrderItemModifier,
  offeringModifierGroups,
  offerings,
  offeringVariants,
  orderItemModifiers,
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
        price: bigint;
        salesTaxGroupId: string | null;
      }
    | undefined
  > {
    const [row] = await this.db
      .select({
        offeringId: offerings.id,
        offeringName: offerings.name,
        variantName: offeringVariants.name,
        price: offeringVariants.price,
        salesTaxGroupId: offerings.salesTaxGroupId,
      })
      .from(offeringVariants)
      .innerJoin(offerings, eq(offeringVariants.offeringId, offerings.id))
      .where(eq(offeringVariants.id, variantId));
    return row;
  }

  // Returns the valid modifier options attached to an offering for server-side price resolution
  async findOfferingModifierOptions(offeringId: string): Promise<
    {
      optionId: string;
      groupId: string;
      name: string;
      additionalPrice: bigint;
    }[]
  > {
    return this.db
      .select({
        optionId: modifierOptions.id,
        groupId: modifierOptions.groupId,
        name: modifierOptions.name,
        additionalPrice: modifierOptions.additionalPrice,
      })
      .from(offeringModifierGroups)
      .innerJoin(modifierOptions, eq(offeringModifierGroups.groupId, modifierOptions.groupId))
      .where(eq(offeringModifierGroups.offeringId, offeringId));
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
