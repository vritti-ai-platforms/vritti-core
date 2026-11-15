import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bigint,
  boolean,
  check,
  decimal,
  foreignKey,
  index,
  timestamp,
  unique,
  uuid,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { purchaseTypeEnum } from './enums';
import { locations } from './locations';
import { partyBankAccounts, partyCommunications, partyRelationships, partyTaxRegistrations } from './parties';
import { paymentTerms } from './payment-terms';
import { suppliers } from './suppliers';
import { legalEntityIdColumn, organizationIdColumn, siteDocumentPolicies, siteIdColumn } from './workspace-scope';

export const supplierEnrollments = commerceSchema.table(
  'supplier_enrollments',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    legalEntityId: legalEntityIdColumn().notNull(),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'cascade' }),
    siteId: siteIdColumn().notNull(),
    partyTaxRegistrationId: uuid('party_tax_registration_id'),
    partyBankAccountId: uuid('party_bank_account_id'),
    orderRelationshipId: uuid('order_relationship_id'),
    orderEmailCommunicationId: uuid('order_email_communication_id').notNull(),
    orderPhoneCommunicationId: uuid('order_phone_communication_id').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    isSupplierActive: boolean('is_supplier_active').notNull().default(true),
    paymentTermId: uuid('payment_term_id')
      .notNull()
      .references(() => paymentTerms.id, { onDelete: 'restrict' }),
    purchaseType: purchaseTypeEnum('purchase_type').notNull().default('STANDARD'),
    approvalEnabled: boolean('approval_enabled').notNull().default(false),
    approverUserIds: uuid('approver_user_ids').array().notNull().default(sql`'{}'::uuid[]`),
    approvalThreshold: bigint('approval_threshold', { mode: 'bigint' }),
    qualityCheckEnabled: boolean('quality_check_enabled').notNull().default(false),
    quarantineLocationId: uuid('quarantine_location_id').references(() => locations.id, { onDelete: 'restrict' }),
    defaultReceiptLocationId: uuid('default_receipt_location_id').references(() => locations.id, {
      onDelete: 'set null',
    }),
    priceTolerancePct: decimal('price_tolerance_pct', { precision: 5, scale: 2, mode: 'number' }).notNull().default(0),
    qtyTolerancePct: decimal('qty_tolerance_pct', { precision: 5, scale: 2, mode: 'number' }).notNull().default(0),
    amountTolerance: bigint('amount_tolerance', { mode: 'bigint' }).notNull().default(0n),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_supplier_enrollments').on(table.supplierId, table.siteId),
    index('idx_supplier_enrollments_supplier').on(table.supplierId),
    index('idx_supplier_enrollments_site').on(table.siteId),
    foreignKey({
      columns: [table.partyTaxRegistrationId],
      foreignColumns: [partyTaxRegistrations.id],
      name: 'fk_supplier_enrollments_tax_registration',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.partyBankAccountId],
      foreignColumns: [partyBankAccounts.id],
      name: 'fk_supplier_enrollments_bank_account',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.orderRelationshipId],
      foreignColumns: [partyRelationships.id],
      name: 'fk_supplier_enrollments_order_relationship',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.orderEmailCommunicationId],
      foreignColumns: [partyCommunications.id],
      name: 'fk_supplier_enrollments_order_email',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.orderPhoneCommunicationId],
      foreignColumns: [partyCommunications.id],
      name: 'fk_supplier_enrollments_order_phone',
    }).onDelete('restrict'),
    check(
      'supplier_enrollments_approvers_chk',
      sql`NOT ${table.approvalEnabled} OR cardinality(${table.approverUserIds}) > 0`,
    ),
    check(
      'supplier_enrollments_quarantine_chk',
      sql`NOT ${table.qualityCheckEnabled} OR ${table.quarantineLocationId} IS NOT NULL`,
    ),
    check(
      'supplier_enrollments_tolerances_chk',
      sql`${table.priceTolerancePct} >= 0 AND ${table.qtyTolerancePct} >= 0 AND ${table.amountTolerance} >= 0`,
    ),
    ...siteDocumentPolicies(),
  ],
);

export type SupplierEnrollment = typeof supplierEnrollments.$inferSelect;
export type NewSupplierEnrollment = typeof supplierEnrollments.$inferInsert;
