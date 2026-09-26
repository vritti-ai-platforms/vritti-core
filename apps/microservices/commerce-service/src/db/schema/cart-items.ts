import { sql } from '@vritti/api-sdk/drizzle-orm';
import { check, integer, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { carts } from './carts';
import { commerceSchema } from './commerce-schema';
import { offeringVariants } from './offering-variants';
import { organizationIdColumn, scopeFromOwnerPolicies } from './workspace-scope';

export const cartItems = commerceSchema.table(
  'cart_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    cartId: uuid('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    offeringVariantId: uuid('offering_variant_id')
      .notNull()
      .references(() => offeringVariants.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_cart_items_cart_variant').on(table.cartId, table.offeringVariantId),
    check('ck_cart_items_quantity', sql`${table.quantity} > 0 and ${table.quantity} <= 99`),
    ...scopeFromOwnerPolicies({ owner: carts, fk: table.cartId }),
  ],
);

export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
