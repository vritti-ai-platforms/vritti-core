import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, index, pgPolicy, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { creditNoteStatusEnum, creditNoteTypeEnum, invoicePartyTypeEnum } from './enums';
import { invoices } from './invoices';

export const creditNotes = commerceSchema.table(
  'credit_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    siteId: uuid('site_id').notNull().default(sql.raw("cast(current_setting('app.site_id') as uuid)")),
    type: creditNoteTypeEnum('type').notNull(),
    partyType: invoicePartyTypeEnum('party_type').notNull(),
    partyId: uuid('party_id'),
    partyName: varchar('party_name', { length: 255 }).notNull(),
    creditNoteNumber: varchar('credit_note_number', { length: 50 }).notNull(),
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
    appliedAmount: bigint('applied_amount', { mode: 'bigint' }).notNull().default(0n),
    remaining: bigint('remaining', { mode: 'bigint' }).notNull(),
    reason: text('reason'),
    status: creditNoteStatusEnum('status').notNull().default('DRAFT'),
    issuedBy: uuid('issued_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_credit_notes_bu_number').on(table.siteId, table.creditNoteNumber),
    index('idx_credit_notes_site').on(table.organizationId, table.siteId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('site_read', {
      for: 'select',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_write', {
      for: 'insert',
      withCheck: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_update', {
      for: 'update',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_delete', {
      for: 'delete',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
  ],
);

export type CreditNote = typeof creditNotes.$inferSelect;
export type NewCreditNote = typeof creditNotes.$inferInsert;

export const creditNoteApplications = commerceSchema.table(
  'credit_note_applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    creditNoteId: uuid('credit_note_id')
      .notNull()
      .references(() => creditNotes.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id),
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
    appliedAt: timestamp('applied_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_credit_note_applications_cn').on(table.creditNoteId),
    index('idx_credit_note_applications_invoice').on(table.invoiceId),
  ],
);

export type CreditNoteApplication = typeof creditNoteApplications.$inferSelect;
export type NewCreditNoteApplication = typeof creditNoteApplications.$inferInsert;
