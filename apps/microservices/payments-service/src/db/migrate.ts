import path from 'node:path';
import { runMigrationsAndGrants } from '@vritti/api-sdk/migrate';
import { DB_MIGRATION_SCHEMA, DB_SCHEMA } from './schema/payments-schema';

// Release-phase one-shot run via `node dist/db/migrate.js` — migrates as the owner, then grants the runtime role
runMigrationsAndGrants({
  migrationsFolder: path.join(__dirname, 'migrations'),
  migrationsTable: '__drizzle_migrations_payments',
  schema: DB_SCHEMA,
  migrationSchema: DB_MIGRATION_SCHEMA,
}).catch((error) => {
  console.error('[migrate] failed:', error);
  process.exit(1);
});
