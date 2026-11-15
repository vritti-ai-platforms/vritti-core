import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  check,
  index,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { purchaseStatusEnum, purchaseStepEnum } from './enums';
import { organizationIdColumn, siteDocumentColumns, siteDocumentPolicies } from './workspace-scope';

export const purchases = commerceSchema.table(
  'purchases',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    ...siteDocumentColumns(),
    purchaseNumber: varchar('purchase_number', { length: 50 }).notNull(),
    quotationsRequired: boolean('quotations_required').notNull().default(false),
    minQuotations: smallint('min_quotations').notNull().default(1),
    step: purchaseStepEnum('step').notNull().default('REQUESTING'),
    status: purchaseStatusEnum('status').notNull().default('OPEN'),
    notes: text('notes'),
    createdBy: uuid('created_by'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_purchases_org_purchase_number').on(table.organizationId, table.purchaseNumber),
    index('idx_purchases_site').on(table.organizationId, table.siteId),
    index('idx_purchases_status').on(table.organizationId, table.status),
    check('purchases_min_quotations_chk', sql`${table.minQuotations} > 0`),
    ...siteDocumentPolicies(),
  ],
);

export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
