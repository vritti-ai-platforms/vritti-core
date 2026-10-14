import { pgSchema } from '@vritti/api-sdk/drizzle-pg-core';

export const DB_SCHEMA = 'payments';
export const DB_MIGRATION_SCHEMA = 'payments_migrations';
export const paymentsSchema = pgSchema(DB_SCHEMA);
