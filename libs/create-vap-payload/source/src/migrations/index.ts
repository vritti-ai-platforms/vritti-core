import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * The migration list, read by `prodMigrations` in payload.config.ts.
 *
 * Empty until the first `pnpm db:migrate:create`. Generated files are imported
 * here in order and **never hand-edited** — except where a generated statement
 * is wrong, which happens: changing a relationship to `hasMany` creates the rels
 * table empty and drops the old column in the same migration, so every existing
 * link vanishes with nothing in the log. Read the SQL before running it.
 *
 * `migrate:create` needs a real terminal, because it prompts whenever a table is
 * dropped in the same run as one is added.
 */
export const migrations: {
  up: (args: MigrateUpArgs) => Promise<void>
  down: (args: MigrateDownArgs) => Promise<void>
  name: string
}[] = []
