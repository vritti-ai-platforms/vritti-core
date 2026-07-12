DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM "vritti_core"."business_units" WHERE "type" = 'FRANCHISEE') THEN
		RAISE EXCEPTION 'Migration aborted: % business_units row(s) still use bu_type FRANCHISEE; reassign them before dropping the value', (SELECT count(*) FROM "vritti_core"."business_units" WHERE "type" = 'FRANCHISEE');
	END IF;
END $$;--> statement-breakpoint
ALTER TABLE "vritti_core"."business_units" DROP CONSTRAINT "bu_registration_outlet_only";--> statement-breakpoint
CREATE TYPE "vritti_core"."bu_type_new" AS ENUM('OUTLET_GROUP', 'OUTLET');--> statement-breakpoint
ALTER TABLE "vritti_core"."business_units" ALTER COLUMN "type" SET DATA TYPE "vritti_core"."bu_type_new" USING "type"::text::"vritti_core"."bu_type_new";--> statement-breakpoint
DROP TYPE "vritti_core"."bu_type";--> statement-breakpoint
ALTER TYPE "vritti_core"."bu_type_new" RENAME TO "bu_type";--> statement-breakpoint
ALTER TABLE "vritti_core"."business_units" ADD CONSTRAINT "bu_registration_outlet_only" CHECK (type = 'OUTLET' OR registration_id IS NULL);
