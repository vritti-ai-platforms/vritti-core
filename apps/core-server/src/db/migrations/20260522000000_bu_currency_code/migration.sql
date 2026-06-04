-- Adds currency_code (ISO 4217) to business_units. BU is the authoritative base currency for the tenant.
-- Existing rows are backfilled to 'INR' (pharmacy tenant default); change in follow-up if other tenants need other defaults.

ALTER TABLE "vritti_core"."business_units" ADD COLUMN "currency_code" varchar(3);--> statement-breakpoint
UPDATE "vritti_core"."business_units" SET "currency_code" = 'INR' WHERE "currency_code" IS NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."business_units" ALTER COLUMN "currency_code" SET NOT NULL;
