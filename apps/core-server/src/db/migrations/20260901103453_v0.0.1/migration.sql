ALTER TABLE "core"."apps" ADD COLUMN "whatsapp_otp_config" jsonb;--> statement-breakpoint
ALTER TABLE "core"."apps" ADD COLUMN "sms_otp_config" jsonb;--> statement-breakpoint
ALTER TABLE "core"."apps" DROP COLUMN "otp_config";