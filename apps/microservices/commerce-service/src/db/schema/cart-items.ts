import { sql } from '@vritti/api-sdk/drizzle-orm';
import { check, foreignKey, integer, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { carts } from './carts';
import { commerceSchema } from './commerce-schema';
import { offeringVariants } from './offering-variants';
import { organizationIdColumn, scopeFromOwnerPolicies } from './workspace-scope';

export const cartItems = commerceSchema.table(
  'cart_items',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    cartId: uuid('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    // The variant by its code, not its id — the storefront addresses products this way, and the
    // composite key below keeps the reference real without a uuid to carry.
    code: varchar('code', { length: 200 }).notNull(),
    quantity: integer('quantity').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_cart_items_cart_variant').on(table.cartId, table.code),
    // A code is unique per organization, never globally, so the reference carries both columns.
    // uq_offering_variants_org_code is what makes this a legal FK target.
    foreignKey({
      columns: [table.organizationId, table.code],
      foreignColumns: [offeringVariants.organizationId, offeringVariants.code],
      name: 'fk_cart_items_variant_code',
    }).onDelete('cascade'),
    check('ck_cart_items_quantity', sql`${table.quantity} > 0 and ${table.quantity} <= 99`),
    ...scopeFromOwnerPolicies({ owner: carts, fk: table.cartId }),
  ],
);

export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
