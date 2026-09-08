DROP INDEX "communications"."uq_whatsapp_accounts_org_default";--> statement-breakpoint
ALTER TABLE "communications"."whatsapp_accounts" DROP COLUMN "is_default";