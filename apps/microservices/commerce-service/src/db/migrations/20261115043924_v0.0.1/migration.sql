ALTER TABLE "commerce"."purchase_suppliers" ADD COLUMN "submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_suppliers" ADD COLUMN "submitted_by" uuid;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_suppliers" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_suppliers" ADD COLUMN "rejected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_suppliers" ADD COLUMN "rejected_by" uuid;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_suppliers" ADD COLUMN "close_reason" text;--> statement-breakpoint
ALTER TABLE "commerce"."purchases" ADD COLUMN "cancel_reason" text;