-- ============================================================================
-- Catalog name is now required. Backfill any existing null names, then enforce
-- NOT NULL on the column.
-- ============================================================================

UPDATE "vritti_core"."catalogs" SET "name" = 'Untitled Catalog' WHERE "name" IS NULL;--> statement-breakpoint

ALTER TABLE "vritti_core"."catalogs" ALTER COLUMN "name" SET NOT NULL;
