/**
 * The Postgres schema every table in this site lives in — declared once, here.
 *
 * **A constant, not a setting, and that is not a style choice.** Payload writes
 * the schema name *into* the SQL of every migration it generates
 * (`CREATE TABLE "__SITE_CODE__"."users"`), so the name is fixed the moment the
 * first migration exists. A schema name that varied by environment would mean
 * migrations that only run in the environment they were generated in.
 *
 * The guard below exists because the failure is otherwise silent and very hard
 * to read: with `schemaName` taken from the environment and the SQL hardcoded,
 * `payload migrate` creates tables in one schema and then tries to record the
 * migration in another, surfacing as
 * `relation "<other schema>.payload_migrations" does not exist` — several
 * frames deep, naming neither cause. A sibling repo has shipped that mismatch
 * for months: three files say `petstore` while every migration says
 * `venkys-pet-store`.
 *
 * `DATABASE_SCHEMA` is therefore read only to *confirm* this value, never to
 * override it. Leaving it unset is fine and normal.
 */
export const DATABASE_SCHEMA = '__SITE_CODE__'

// Thrown at config load rather than checked per query: this cannot be recovered
// from at runtime, and the sooner it is said the less confusing it is. Safe for
// `pnpm build`, which runs with no environment at all and so never trips it.
if (process.env.DATABASE_SCHEMA && process.env.DATABASE_SCHEMA !== DATABASE_SCHEMA) {
  throw new Error(
    [
      `DATABASE_SCHEMA is set to "${process.env.DATABASE_SCHEMA}", but this site's`,
      `migrations are written for "${DATABASE_SCHEMA}".`,
      '',
      'The schema name is baked into every generated migration, so the two must',
      'match. Either set DATABASE_SCHEMA to the value above, or change',
      'DATABASE_SCHEMA in src/lib/schema.ts and regenerate every migration.',
    ].join(' '),
  )
}
