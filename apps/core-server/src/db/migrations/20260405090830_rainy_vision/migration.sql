DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'MOBILE' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'session_type')) THEN
    ALTER TYPE "vritti_core"."session_type" ADD VALUE 'MOBILE';
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "vritti_core"."business_units" DROP COLUMN IF EXISTS "feature_catalog";
