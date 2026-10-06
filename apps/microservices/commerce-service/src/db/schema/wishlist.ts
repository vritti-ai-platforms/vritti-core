import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, pgPolicy, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { offeringVariants } from './offering-variants';
import { parties } from './parties';

export const wishlistItems = commerceSchema.table(
  'wishlist_items',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    // No foreign key — the row lives in core's `apps`, as with `carts.app_id`
    appId: uuid('app_id').notNull(),
    partyId: uuid('party_id')
      .notNull()
      .references(() => parties.id, { onDelete: 'cascade' }),
    offeringVariantId: uuid('offering_variant_id')
      .notNull()
      .references(() => offeringVariants.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Saving twice saves the same thing. The insert takes this as its idempotency key rather
    // than reading first, so two taps in quick succession cannot make two rows.
    unique('uq_wishlist_items_party_variant').on(
      table.organizationId,
      table.appId,
      table.partyId,
      table.offeringVariantId,
    ),
    // The list query: one shopper's wishlist in one storefront, newest first.
    index('idx_wishlist_items_party').on(table.organizationId, table.appId, table.partyId, table.createdAt),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type WishlistItem = typeof wishlistItems.$inferSelect;
export type NewWishlistItem = typeof wishlistItems.$inferInsert;
