import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Puts `CREATE SCHEMA IF NOT EXISTS` at the top of the first migration.
 *
 * Payload qualifies every statement it generates with the schema —
 * `CREATE TABLE "site"."users"` — but never creates the schema itself. A dev
 * `push` would, and this project does not do that (`push: false`), so the first
 * `payload migrate` against a database that has never seen this site fails on
 * statement one with `schema "site" does not exist`.
 *
 * **It cannot be a migration of its own, which is the non-obvious part.**
 * Payload writes a row into `payload_migrations` immediately after running each
 * migration file, and that table is created *by* the generated migration — so a
 * schema-only migration running first always dies recording itself:
 * `relation "site.payload_migrations" does not exist`.
 *
 * It also cannot be an npm script that runs before `payload migrate`: the
 * production container applies pending migrations from inside Payload's own
 * startup (`prodMigrations`), where no script of ours runs at all.
 *
 * That leaves editing the generated file, which is what the sibling sites do by
 * hand and then have to remember on every regeneration. This does it as part of
 * `db:migrate:create` instead.
 *
 * Idempotent, and touches exactly one file: if any migration already carries the
 * line, nothing happens.
 */

const dir = join(process.cwd(), 'src', 'migrations')
const schemaFile = join(process.cwd(), 'src', 'lib', 'schema.ts')

// Read the name from the one place that declares it, rather than taking a second
// copy that could drift from it.
const declared = /export const DATABASE_SCHEMA = '([^']+)'/.exec(readFileSync(schemaFile, 'utf8'))
if (!declared) {
  console.error('ensure-schema: could not find DATABASE_SCHEMA in src/lib/schema.ts')
  process.exit(1)
}
const schema = declared[1]

const migrations = readdirSync(dir)
  .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
  .sort()

if (migrations.length === 0) {
  console.log('ensure-schema: no migrations yet, nothing to do')
  process.exit(0)
}

const already = migrations.find((f) => readFileSync(join(dir, f), 'utf8').includes('CREATE SCHEMA'))
if (already) {
  console.log(`ensure-schema: already present in ${already}`)
  process.exit(0)
}

// The first migration by name is the first to run — `payload migrate` reads the
// directory sorted, and `writeMigrationIndex` regenerates index.ts the same way.
const target = migrations[0]
const path = join(dir, target)
const source = readFileSync(path, 'utf8')

const anchor = /(export async function up\(\{[^}]*\}: MigrateUpArgs\): Promise<void> \{\n)/
if (!anchor.test(source)) {
  console.error(`ensure-schema: could not find up() in ${target} — add the line by hand:`)
  console.error(`  await db.execute(sql\`CREATE SCHEMA IF NOT EXISTS "${schema}";\`)`)
  process.exit(1)
}

const line = [
  '  // Inserted by scripts/ensure-schema.mjs, because Payload qualifies every',
  '  // statement below with the schema but never creates it. Do not remove: the',
  '  // first migrate against a fresh database fails on statement one without it.',
  `  await db.execute(sql\`CREATE SCHEMA IF NOT EXISTS "${schema}";\`)`,
  '',
  '',
].join('\n')

writeFileSync(path, source.replace(anchor, `$1${line}`), 'utf8')
console.log(`ensure-schema: added CREATE SCHEMA "${schema}" to ${target}`)
