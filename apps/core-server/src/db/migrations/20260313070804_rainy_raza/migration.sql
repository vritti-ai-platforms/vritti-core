ALTER TABLE "nexus"."users" DROP CONSTRAINT "users_external_id_key";--> statement-breakpoint
ALTER TABLE "nexus"."users" ADD COLUMN "organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "nexus"."users" DROP COLUMN "external_id";--> statement-breakpoint
ALTER TABLE "nexus"."organizations" DROP COLUMN "industry_id";--> statement-breakpoint
ALTER TABLE "nexus"."users" ADD CONSTRAINT "users_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "nexus"."organizations"("id") ON DELETE CASCADE;