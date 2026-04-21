import { bigint, index, pgPolicy, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { coreSchema } from './core-schema';
import { creditNoteTypeEnum, creditNoteStatusEnum, invoicePartyTypeEnum } from './enums';
import { invoices } from './invoices';

export const creditNotes = coreSchema.table(
  'credit_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    businessUnitId: uuid('business_unit_id').notNull().default(sql`current_setting('app.bu_id')::uuid`),
    type: creditNoteTypeEnum('type').notNull(),
    partyType: invoicePartyTypeEnum('party_type').notNull(),
    partyId: uuid('party_id'),
    partyName: varchar('party_name', { length: 255 }).notNull(),
    creditNoteNumber: varchar('credit_note_number', { length: 50 }).notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    appliedAmount: bigint('applied_amount', { mode: 'number' }).notNull().default(0),
    remaining: bigint('remaining', { mode: 'number' }).notNull(),
    reason: text('reason'),
    status: creditNoteStatusEnum('status').notNull().default('DRAFT'),
    issuedBy: uuid('issued_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_credit_notes_bu_number').on(table.businessUnitId, table.creditNoteNumber),
    index('idx_credit_notes_bu').on(table.organizationId, table.businessUnitId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = current_setting('app.org_id', true)::uuid`,
    }),
    pgPolicy('bu_ancestor_read', {
      for: 'select',
      using: sql`business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[])`,
    }),
    pgPolicy('bu_write', {
      for: 'insert',
      withCheck: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_update', {
      for: 'update',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_delete', {
      for: 'delete',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
  ],
);

export type CreditNote = typeof creditNotes.$inferSelect;
export type NewCreditNote = typeof creditNotes.$inferInsert;

export const creditNoteApplications = coreSchema.table(
  'credit_note_applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    creditNoteId: uuid('credit_note_id').notNull().references(() => creditNotes.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    appliedAt: timestamp('applied_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_credit_note_applications_cn').on(table.creditNoteId),
    index('idx_credit_note_applications_invoice').on(table.invoiceId),
  ],
);

export type CreditNoteApplication = typeof creditNoteApplications.$inferSelect;
export type NewCreditNoteApplication = typeof creditNoteApplications.$inferInsert;
