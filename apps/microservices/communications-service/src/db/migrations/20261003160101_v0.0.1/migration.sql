ALTER TABLE "communications"."sms_otps" ALTER COLUMN "id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "communications"."sms_providers" ALTER COLUMN "id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "communications"."sms_provider_templates" ALTER COLUMN "id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "communications"."whatsapp_accounts" ALTER COLUMN "id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "communications"."whatsapp_otps" ALTER COLUMN "id" SET DEFAULT uuidv7();