import { pgSchema } from '@vritti/api-sdk/drizzle-pg-core';

// Commerce service schema — shared vritti_core schema with core-server
export const coreSchema = pgSchema('vritti_core');
