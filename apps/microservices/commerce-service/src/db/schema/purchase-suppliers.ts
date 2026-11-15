import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, boolean, index, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { purchaseLegStatusEnum, purchaseLegStepEnum, purchaseTypeEnum } from './enums';
import { purchases } from './purchases';
import { supplierEnrollments } from './supplier-enrollments';
import { suppliers } from './suppliers';
import { organizationIdColumn, scopeFromOwnerPolicies } from './workspace-scope';

export const purchaseSuppliers = commerceSchema.table(
  'purchase_suppliers',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    purchaseId: uuid('purchase_id')
      .notNull()
      .references(() => purchases.id, { onDelete: 'cascade' }),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'restrict' }),
    supplierEnrollmentId: uuid('supplier_enrollment_id')
      .notNull()
      .references(() => supplierEnrollments.id, { onDelete: 'restrict' }),
    type: purchaseTypeEnum('type').notNull(),
    approvalEnabled: boolean('approval_enabled').notNull(),
    approvalThreshold: bigint('approval_threshold', { mode: 'bigint' }),
    qualityCheckEnabled: boolean('quality_check_enabled').notNull(),
    step: purchaseLegStepEnum('step').notNull().default('SOURCING'),
    status: purchaseLegStatusEnum('status').notNull().default('OPEN'),
    approvedBy: uuid('approved_by'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_purchase_suppliers_purchase_supplier').on(table.purchaseId, table.supplierId),
    index('idx_purchase_suppliers_supplier').on(table.supplierId),
    index('idx_purchase_suppliers_enrollment').on(table.supplierEnrollmentId),
    ...scopeFromOwnerPolicies({ owner: purchases, fk: table.purchaseId, ownerIs: 'siteDocument' }),
  ],
);

export type PurchaseSupplier = typeof purchaseSuppliers.$inferSelect;
export type NewPurchaseSupplier = typeof purchaseSuppliers.$inferInsert;
