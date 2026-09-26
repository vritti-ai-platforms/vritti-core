import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, pgPolicy, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { offeringVariants } from './offering-variants';
import { parties } from './parties';

/**
 * Something a shopper marked to come back to.
 *
 * Scoped by party and app, never a site: the party is the person across every surface the
 * organization runs, and the app is which storefront they saved it in.
 *
 * It stores the **product**, not one catalogue's offer of it. A listing belongs to a single
 * catalogue and a catalogue is per channel, so a saved row keyed to one would stop resolving the
 * moment the shop relisted the item — and outliving what it points at is the whole character of a
 * wishlist.
 *
 * A row with nothing on it but the fact it exists. There is no quantity to change and no state to
 * move through, which is why the feature grants only view, add and delete: an `edit` would have
 * nothing to edit.
 */
export const wishlistItems = commerceSchema.table(
  'wishlist_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    /** No foreign key — the row lives in core's `apps`, as with `carts.app_id`. */
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
