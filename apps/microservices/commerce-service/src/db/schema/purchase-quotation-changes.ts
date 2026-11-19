import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, smallint, text, timestamp, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { purchaseQuotationChangeTypeEnum } from './enums';
import { purchases } from './purchases';
import { organizationIdColumn, scopeFromOwnerPolicies } from './workspace-scope';

export const purchaseQuotationChanges = commerceSchema.table(
  'purchase_quotation_changes',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    purchaseId: uuid('purchase_id')
      .notNull()
      .references(() => purchases.id, { onDelete: 'cascade' }),
    type: purchaseQuotationChangeTypeEnum('type').notNull(),
    fromMinQuotations: smallint('from_min_quotations'),
    toMinQuotations: smallint('to_min_quotations'),
    reason: text('reason'),
    changedBy: uuid('changed_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_purchase_quotation_changes_purchase').on(table.purchaseId),
    ...scopeFromOwnerPolicies({ owner: purchases, fk: table.purchaseId, ownerIs: 'siteDocument' }),
  ],
);

export type PurchaseQuotationChange = typeof purchaseQuotationChanges.$inferSelect;
export type NewPurchaseQuotationChange = typeof purchaseQuotationChanges.$inferInsert;
