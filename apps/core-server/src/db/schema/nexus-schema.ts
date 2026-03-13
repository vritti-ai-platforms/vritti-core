import { pgSchema } from '@vritti/api-sdk/drizzle-pg-core';

// Nexus schema - all primary database tables live in the 'nexus' schema
export const nexusSchema = pgSchema('nexus');
