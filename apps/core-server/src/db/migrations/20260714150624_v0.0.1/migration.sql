CREATE TYPE "vritti_core"."scope_type" AS ENUM('ORG', 'LE', 'SITE_GROUP', 'SITE');--> statement-breakpoint
ALTER TABLE "vritti_core"."roles" ADD COLUMN "scope" "vritti_core"."scope_type" DEFAULT 'ORG'::"vritti_core"."scope_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."roles" ADD COLUMN "site_type" "vritti_core"."site_type";