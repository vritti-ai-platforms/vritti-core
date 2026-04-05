import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

const dbUrl = process.env.PRIMARY_DB_DATABASE_DIRECT_URL;
if (!dbUrl) {
  throw new Error('PRIMARY_DB_DATABASE_DIRECT_URL environment variable is required');
}

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  schemaFilter: ['vritti_core'],
  dbCredentials: {
    url: dbUrl,
  },
  migrations: {
    table: '__drizzle_migrations_commerce',
    schema: 'drizzle',
  },
  verbose: true,
  strict: true,
});
