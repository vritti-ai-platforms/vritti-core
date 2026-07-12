ALTER TABLE "vritti_core"."business_units" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "vritti_core"."bu_type";--> statement-breakpoint
CREATE TYPE "vritti_core"."bu_type" AS ENUM('REGION', 'FRANCHISEE', 'BRANCH');--> statement-breakpoint
ALTER TABLE "vritti_core"."business_units" ALTER COLUMN "type" SET DATA TYPE "vritti_core"."bu_type" USING "type"::"vritti_core"."bu_type";