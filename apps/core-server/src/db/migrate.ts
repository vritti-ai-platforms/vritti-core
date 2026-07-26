import path from 'node:path';
import { runMigrationsAndGrants } from '@vritti/api-sdk/migrate';
import { DB_MIGRATION_SCHEMA, DB_SCHEMA } from './schema/core-schema';

// Release-phase one-shot: apply migrations as the owner, then grant the runtime role.
runMigrationsAndGrants({
  migrationsFolder: path.join(__dirname, 'migrations'),
  migrationsTable: '__drizzle_migrations_core',
  schema: DB_SCHEMA,
  migrationSchema: DB_MIGRATION_SCHEMA,
}).catch((error) => {
  console.error('[migrate] failed:', error);
  process.exit(1);
});
