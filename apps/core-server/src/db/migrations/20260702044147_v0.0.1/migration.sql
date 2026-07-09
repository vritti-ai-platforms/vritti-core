DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'vritti_core' AND table_name = 'catalogs')
     AND NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'vritti_core' AND table_name = 'catalogs' AND column_name = 'hash') THEN
    ALTER TABLE "vritti_core"."catalogs" RENAME TO "catalogs_legacy_backup";
  END IF;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vritti_core"."catalogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"version" varchar(50) NOT NULL,
	"hash" varchar(64) NOT NULL,
	"license" jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"activated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."organizations" ADD COLUMN IF NOT EXISTS "plan_code" varchar(100);--> statement-breakpoint
ALTER TABLE "vritti_core"."organizations" ADD COLUMN IF NOT EXISTS "business_code" varchar(100);--> statement-breakpoint
ALTER TABLE "vritti_core"."organizations" ADD COLUMN IF NOT EXISTS "entitlement" jsonb;--> statement-breakpoint
ALTER TABLE "vritti_core"."business_units" ADD COLUMN IF NOT EXISTS "feature_unlocks" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "catalogs_hash_unique" ON "vritti_core"."catalogs" ("hash");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "catalogs_active_unique" ON "vritti_core"."catalogs" ("is_active") WHERE "is_active";