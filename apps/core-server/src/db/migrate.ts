import path from 'node:path';
import { runMigrationsAndGrants } from '@vritti/api-sdk/migrate';

// Release-phase one-shot: apply migrations as the owner, then grant the runtime role.
runMigrationsAndGrants({
  migrationsFolder: path.join(__dirname, 'migrations'),
  migrationsTable: '__drizzle_migrations_core',
}).catch((error) => {
  console.error('[migrate] failed:', error);
  process.exit(1);
});
