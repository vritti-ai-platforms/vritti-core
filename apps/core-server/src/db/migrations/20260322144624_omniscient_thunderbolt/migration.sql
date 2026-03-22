ALTER TABLE "vritti_core"."users" DROP CONSTRAINT "users_email_key";--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_org_unique" ON "vritti_core"."users" ("email","organization_id");