// Executes a .sql file against PRIMARY_DB_DATABASE_DIRECT_URL (the owner connection injected by
// infisical). Used by each service's `db:grant` script so grants can be (re)applied without a
// local `psql` binary — the same `pg` driver runMigrationsAndGrants uses, so it works identically
// for the local Docker DB and over dev/prod tunnels.
//
//   node tools/run-sql.cjs <path-to-sql-file>
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('usage: run-sql.cjs <path-to-sql-file>');

  const url = process.env.PRIMARY_DB_DATABASE_DIRECT_URL;
  if (!url) throw new Error('PRIMARY_DB_DATABASE_DIRECT_URL environment variable is required');

  const sql = fs.readFileSync(path.resolve(file), 'utf8');
  const client = new Client({ connectionString: url });
  // Surface RAISE NOTICE output (the guarded-skip / granted messages).
  client.on('notice', (n) => console.log(n.message));

  await client.connect();
  try {
    await client.query(sql);
    console.log(`[run-sql] applied ${file}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`[run-sql] failed: ${error.message}`);
  process.exit(1);
});
