ALTER TYPE "vritti_core"."bu_type" RENAME VALUE 'BRANCH' TO 'OUTLET';--> statement-breakpoint
ALTER TABLE "vritti_core"."business_units" ADD CONSTRAINT "bu_registration_outlet_only" CHECK (type = 'OUTLET' OR registration_id IS NULL);
