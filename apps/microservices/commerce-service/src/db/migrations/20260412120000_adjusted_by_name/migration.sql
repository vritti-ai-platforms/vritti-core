-- Rename adjusted_by → adjusted_by_id
ALTER TABLE "vritti_core"."stock_adjustments" RENAME COLUMN "adjusted_by" TO "adjusted_by_id";--> statement-breakpoint

-- Add adjusted_by_name column
ALTER TABLE "vritti_core"."stock_adjustments" ADD COLUMN "adjusted_by_name" varchar(255);
