CREATE TYPE "vritti_core"."media_status" AS ENUM('pending', 'ready', 'failed', 'deleted');--> statement-breakpoint
CREATE TABLE "vritti_core"."media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"original_name" varchar(255) NOT NULL,
	"mime_type" varchar(255) NOT NULL,
	"size" bigint NOT NULL,
	"checksum" varchar(128),
	"storage_key" varchar(512) NOT NULL,
	"bucket" varchar(255),
	"provider" varchar(50) NOT NULL,
	"status" "vritti_core"."media_status" DEFAULT 'pending'::"vritti_core"."media_status" NOT NULL,
	"entity_type" varchar(255) NOT NULL,
	"entity_id" varchar(255) NOT NULL,
	"uploaded_by" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."users" ADD COLUMN "display_name" varchar(255);--> statement-breakpoint
ALTER TABLE "vritti_core"."users" ADD COLUMN "locale" varchar(10);--> statement-breakpoint
ALTER TABLE "vritti_core"."users" ADD COLUMN "timezone" varchar(50);--> statement-breakpoint
CREATE INDEX "idx_media_entity" ON "vritti_core"."media" ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_media_uploaded_by" ON "vritti_core"."media" ("uploaded_by");--> statement-breakpoint
CREATE INDEX "idx_media_status" ON "vritti_core"."media" ("status");--> statement-breakpoint
CREATE INDEX "idx_media_checksum" ON "vritti_core"."media" ("checksum");--> statement-breakpoint
CREATE INDEX "idx_media_storage_key" ON "vritti_core"."media" ("storage_key");