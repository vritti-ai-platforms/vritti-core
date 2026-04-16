import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

const dbUrl = process.env.PRIMARY_DB_DATABASE_DIRECT_URL;
const dbSchema = process.env.PRIMARY_DB_SCHEMA;
const migrationsSchema = process.env.PRIMARY_DB_MIGRATIONS_SCHEMA ?? dbSchema;

if (!dbUrl) {
  throw new Error('PRIMARY_DB_DATABASE_DIRECT_URL environment variable is required');
}

if (!dbSchema) {
  throw new Error('PRIMARY_DB_SCHEMA environment variable is required');
}

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  schemaFilter: [dbSchema],
  dbCredentials: {
    url: dbUrl,
  },
  migrations: {
    table: '__drizzle_migrations_commerce',
    schema: migrationsSchema,
  },
  verbose: true,
  strict: true,
});
