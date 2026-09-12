ALTER TABLE "core"."sites" DROP CONSTRAINT "sites_registration_id_le_tax_registrations_id_fkey";--> statement-breakpoint
ALTER TABLE "core"."sites" ADD COLUMN "registration_number" varchar(50);--> statement-breakpoint
ALTER TABLE "core"."sites" ADD COLUMN "jurisdiction_id" uuid;