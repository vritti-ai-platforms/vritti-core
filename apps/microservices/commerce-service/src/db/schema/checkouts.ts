import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type AnyPgColumn,
  bigint,
  index,
  integer,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { checkoutStatusEnum } from './enums';
import { offeringVariants } from './offering-variants';
import { offerings } from './offerings';
import { parties, partyAddresses } from './parties';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

// A checkout is the cart frozen at the moment the shopper pays: the lines of every store they are buying from, priced
// as they were. Payment intents point at it (payments.payment_intents.checkout_id); orders are made from it once one of
// them pays, one per store. Organization-owned, since one checkout reaches across stores and legal entities
export const checkouts = commerceSchema.table(
  'checkouts',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    // No foreign key — the row lives in core's `apps`, as with `carts.app_id`
    appId: uuid('app_id').notNull(),
    partyId: uuid('party_id')
      .notNull()
      .references(() => parties.id, { onDelete: 'cascade' }),
    status: checkoutStatusEnum('status').notNull().default('OPEN'),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    // Every line added up, in minor units — what the payment is opened for
    totalAmount: bigint('total_amount', { mode: 'bigint' }).notNull(),
    // The cart's fingerprint: a hash of the currency, the stores and every frozen line (variant, quantity, price).
    // Checkout pressed again on the same cart reaches the same open checkout; any edit to the cart gives a new one
    checkoutKey: varchar('checkout_key', { length: 100 }).notNull(),
    // Who is paying, as the orders and the gateway's page will show them
    customerName: varchar('customer_name', { length: 255 }),
    customerPhone: varchar('customer_phone', { length: 20 }),
    customerEmail: varchar('customer_email', { length: 200 }),
    // The party's saved address the orders are delivered to; none makes them takeaway orders. The address itself is
    // read when the orders are made, so the checkout holds no copy of it
    partyAddressId: uuid('party_address_id').references(() => partyAddresses.id, { onDelete: 'set null' }),
    // When the checkout's window closes, or closed — the status says which: while OPEN the deadline, which every
    // payment intent opened for it shares; EXPIRED the deadline that passed; CANCELLED the moment the shopper ended
    // it; PAID and CONVERTED the moment the payment landed. One column instead of paid_at and cancelled_at
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    // The newer checkout that replaced this one when the party checked out an edited cart. A payment that still lands
    // on a replaced checkout is refused and refunded: the party moved on to the newer cart
    replacedByCheckoutId: uuid('replaced_by_checkout_id').references((): AnyPgColumn => checkouts.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // A party has at most one OPEN checkout: checking out an edited cart replaces the open one
    uniqueIndex('uq_checkouts_one_open_per_party').on(table.organizationId, table.partyId).where(sql`status = 'OPEN'`),
    index('idx_checkouts_party_key').on(table.organizationId, table.partyId, table.checkoutKey),
    index('idx_checkouts_party').on(table.organizationId, table.partyId, table.createdAt),
    index('idx_checkouts_status').on(table.status),
    // The expiry sweep reads open checkouts by deadline
    index('idx_checkouts_open_expiry').on(table.status, table.expiresAt),
    orgIsolationPolicy(),
  ],
);

export type Checkout = typeof checkouts.$inferSelect;
export type NewCheckout = typeof checkouts.$inferInsert;

// One cart line as it was when the checkout opened, and the store whose order it becomes
export const checkoutLines = commerceSchema.table(
  'checkout_lines',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    checkoutId: uuid('checkout_id')
      .notNull()
      .references(() => checkouts.id, { onDelete: 'cascade' }),
    // The store the line was added at and the legal entity paid for it — both live in core, so no foreign keys
    siteId: uuid('site_id').notNull(),
    legalEntityId: uuid('legal_entity_id').notNull(),
    offeringId: uuid('offering_id')
      .notNull()
      .references(() => offerings.id),
    offeringVariantId: uuid('offering_variant_id')
      .notNull()
      .references(() => offeringVariants.id),
    name: varchar('name', { length: 500 }).notNull(),
    code: varchar('code', { length: 200 }).notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: bigint('unit_price', { mode: 'bigint' }).notNull(),
    lineTotal: bigint('line_total', { mode: 'bigint' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Converting reads one store's lines at a time
    index('idx_checkout_lines_checkout_site').on(table.checkoutId, table.siteId),
    orgIsolationPolicy(),
  ],
);

export type CheckoutLine = typeof checkoutLines.$inferSelect;
export type NewCheckoutLine = typeof checkoutLines.$inferInsert;
