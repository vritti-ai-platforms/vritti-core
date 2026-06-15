CREATE TYPE "vritti_core"."category_role" AS ENUM('GROUP', 'CATEGORY');--> statement-breakpoint
ALTER TABLE "vritti_core"."categories" ADD COLUMN "category_role" "vritti_core"."category_role" DEFAULT 'CATEGORY'::"vritti_core"."category_role" NOT NULL;--> statement-breakpoint
-- Backfill: any category that already has children is a GROUP; leaves stay CATEGORY (the default).
UPDATE "vritti_core"."categories" parent
SET "category_role" = 'GROUP'::"vritti_core"."category_role"
WHERE EXISTS (
  SELECT 1 FROM "vritti_core"."categories" child WHERE child."parent_id" = parent."id"
);