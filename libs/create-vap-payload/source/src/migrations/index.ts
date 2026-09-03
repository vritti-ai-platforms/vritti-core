import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * The migration list, read by `prodMigrations` in payload.config.ts.
 *
 * Empty until the first `pnpm db:migrate:create`, which **regenerates this file
 * wholesale** from the directory listing — so nothing hand-written here
 * survives, and anything that must persist belongs in a migration file instead.
 *
 * Generated files are otherwise never hand-edited, with one deliberate
 * exception: the first migration carries a `CREATE SCHEMA IF NOT EXISTS` line,
 * inserted by `scripts/ensure-schema.mjs` as part of `db:migrate:create`. See
 * that script for why it cannot live anywhere else.
 *
 * `migrate:create` needs a real terminal — it prompts whenever a table is
 * dropped in the same run as one is added. Read the SQL before running it;
 * changing a relationship to `hasMany` creates the rels table empty and drops
 * the old column in the same migration, so every existing link vanishes with
 * nothing in the log.
 */
export const migrations: {
  up: (args: MigrateUpArgs) => Promise<void>
  down: (args: MigrateDownArgs) => Promise<void>
  name: string
}[] = []
