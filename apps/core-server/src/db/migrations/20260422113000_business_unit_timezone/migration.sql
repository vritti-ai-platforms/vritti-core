ALTER TABLE "vritti_core"."business_units" ADD COLUMN "timezone" varchar(50);
--> statement-breakpoint
UPDATE "vritti_core"."business_units"
SET "timezone" = COALESCE(NULLIF(metadata->>'timezone', ''), 'Asia/Kolkata');
--> statement-breakpoint
UPDATE "vritti_core"."business_units"
SET "metadata" = "metadata" - 'timezone'
WHERE "metadata" ? 'timezone';
--> statement-breakpoint
ALTER TABLE "vritti_core"."business_units" ALTER COLUMN "timezone" SET NOT NULL;
