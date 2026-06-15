import path from 'node:path';
import { runMigrationsAndGrants } from '@vritti/api-sdk/migrate';

// Release-phase one-shot: apply migrations as the owner, then grant the runtime role.
// Run via `node dist/db/migrate.js` (the migrations folder is copied next to it in the image).
runMigrationsAndGrants({
  migrationsFolder: path.join(__dirname, 'migrations'),
  migrationsTable: '__drizzle_migrations_commerce',
}).catch((error) => {
  console.error('[migrate] failed:', error);
  process.exit(1);
});
