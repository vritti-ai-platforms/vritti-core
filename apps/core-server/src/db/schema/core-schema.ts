import { pgSchema } from '@vritti/api-sdk/drizzle-pg-core';

// Core schema - all primary database tables live in the 'core' schema
export const DB_SCHEMA = 'core';
export const DB_MIGRATION_SCHEMA = 'core_migrations';
export const coreSchema = pgSchema(DB_SCHEMA);
