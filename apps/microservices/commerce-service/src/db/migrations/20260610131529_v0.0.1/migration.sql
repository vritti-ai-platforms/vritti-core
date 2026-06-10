ALTER TABLE "vritti_core"."supplier_items" ADD COLUMN "tax_inclusive" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_rates" DROP COLUMN "type";--> statement-breakpoint
DROP TYPE "vritti_core"."tax_rate_type";