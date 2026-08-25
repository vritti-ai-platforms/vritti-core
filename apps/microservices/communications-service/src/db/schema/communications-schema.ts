import { pgSchema } from '@vritti/api-sdk/drizzle-pg-core';

export const DB_SCHEMA = 'communications';
export const DB_MIGRATION_SCHEMA = 'communications_migrations';
export const communicationsSchema = pgSchema(DB_SCHEMA);
