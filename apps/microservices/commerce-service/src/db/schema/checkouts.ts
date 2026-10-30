import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, index, integer, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { checkoutStatusEnum } from './enums';
import { offeringVariants } from './offering-variants';
import { offerings } from './offerings';
import { parties } from './parties';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

// A checkout is the cart frozen at the moment the shopper pays: the lines of every store they are buying from, priced
// as they were, and the one payment that covers them all. Orders are made from it only once the payment lands, one per
// store. Organization-owned, since one checkout reaches across stores and legal entities
export const checkouts = commerceSchema.table(
  'checkouts',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    // No foreign key — the row lives in core's `apps`, as with `carts.app_id`
    appId: uuid('app_id').notNull(),
    partyId: uuid('party_id')
      .notNull()
      .references(() => parties.id, { onDelete: 'cascade' }),
    status: checkoutStatusEnum('status').notNull().default('OPEN'),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    // Every line added up, in minor units — what the payment is opened for
    totalAmount: bigint('total_amount', { mode: 'bigint' }).notNull(),
    // The gateway the shopper picked, e.g. razorpay; core resolves the account it charges through
    gatewayCode: varchar('gateway_code', { length: 100 }).notNull(),
    // The storefront's key for this attempt: pressing Pay twice reaches the same checkout
    checkoutKey: varchar('checkout_key', { length: 100 }).notNull(),
    // Set once the payment opens; a late event for it still finds this checkout
    paymentIntentId: uuid('payment_intent_id'),
    // Who is paying, as the orders and the gateway's page will show them
    customerName: varchar('customer_name', { length: 255 }),
    customerPhone: varchar('customer_phone', { length: 20 }),
    customerEmail: varchar('customer_email', { length: 200 }),
    deliveryAddress: text('delivery_address'),
    notes: text('notes'),
    // When the payment window closes; the payment intent expires at the same moment
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancellationReason: text('cancellation_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_checkouts_party_key').on(table.organizationId, table.partyId, table.checkoutKey),
    unique('uq_checkouts_payment_intent').on(table.paymentIntentId),
    index('idx_checkouts_party').on(table.organizationId, table.partyId, table.createdAt),
    index('idx_checkouts_status').on(table.status),
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
    organizationId: organizationIdColumn,
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
