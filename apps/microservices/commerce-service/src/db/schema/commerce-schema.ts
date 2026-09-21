import { pgSchema } from '@vritti/api-sdk/drizzle-pg-core';

export const DB_SCHEMA = 'commerce';
export const DB_MIGRATION_SCHEMA = 'commerce_migrations';
export const commerceSchema = pgSchema(DB_SCHEMA);
