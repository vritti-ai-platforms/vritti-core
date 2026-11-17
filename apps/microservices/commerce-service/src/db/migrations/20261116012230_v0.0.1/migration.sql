ALTER TABLE "commerce"."purchase_suppliers" ADD COLUMN "receiving_closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_suppliers" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_suppliers" ADD COLUMN "cancelled_by" uuid;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_suppliers" ADD COLUMN "cancel_reason" text;--> statement-breakpoint
ALTER TABLE "commerce"."purchases" DROP COLUMN "step";--> statement-breakpoint
DROP TYPE "commerce"."purchase_step";