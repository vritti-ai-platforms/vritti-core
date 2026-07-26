import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';
import { DB_MIGRATION_SCHEMA, DB_SCHEMA } from './src/db/schema/core-schema';

const dbUrl = process.env.PRIMARY_DB_DATABASE_DIRECT_URL;

if (!dbUrl) {
  throw new Error('PRIMARY_DB_DATABASE_DIRECT_URL environment variable is required');
}

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  schemaFilter: [DB_SCHEMA],
  dbCredentials: {
    url: dbUrl,
  },
  migrations: {
    table: '__drizzle_migrations_core',
    schema: DB_MIGRATION_SCHEMA,
  },
  verbose: true,
  strict: true,
});
