CREATE TYPE "commerce"."catalog_channel_type" AS ENUM('APP', 'POS', 'B2B');--> statement-breakpoint
CREATE TABLE "commerce"."catalog_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"catalog_id" uuid NOT NULL,
	"type" "commerce"."catalog_channel_type" NOT NULL,
	"legal_entity_id" uuid,
	"site_id" uuid,
	"app_id" uuid,
	"terminal_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_catalog_channels_scope" UNIQUE NULLS NOT DISTINCT("type","organization_id","legal_entity_id","site_id","app_id","terminal_id"),
	CONSTRAINT "ck_catalog_channels_target_matches_type" CHECK (case "type"
            when 'APP' then "terminal_id" is null
            when 'POS' then "app_id" is null
            else "app_id" is null and "terminal_id" is null
          end),
	CONSTRAINT "ck_catalog_channels_terminal_needs_site" CHECK ("terminal_id" is null or "site_id" is not null),
	CONSTRAINT "ck_catalog_channels_site_needs_le" CHECK ("site_id" is null or "legal_entity_id" is not null)
);
--> statement-breakpoint
ALTER TABLE "commerce"."catalog_channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "org_isolation" ON "commerce"."catalog_sales_channels";--> statement-breakpoint
DROP POLICY "org_isolation" ON "commerce"."sales_channels";--> statement-breakpoint
ALTER TABLE "commerce"."catalog_listing_channel_exclusions" DROP CONSTRAINT "catalog_listing_channel_exclusions_hrGp7SHYU4A7_fkey";--> statement-breakpoint
ALTER TABLE "commerce"."catalog_sales_channels" DROP CONSTRAINT "catalog_sales_channels_sales_channel_id_sales_channels_id_fkey";--> statement-breakpoint
ALTER TABLE "commerce"."orders" DROP CONSTRAINT "orders_channel_id_sales_channels_id_fkey";--> statement-breakpoint
DROP TABLE "commerce"."catalog_sales_channels";--> statement-breakpoint
DROP TABLE "commerce"."sales_channels";--> statement-breakpoint
ALTER TABLE "commerce"."catalog_listing_channel_exclusions" ADD COLUMN "catalog_channel_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."catalog_listing_channel_exclusions" DROP COLUMN "sales_channel_id";--> statement-breakpoint
ALTER TABLE "commerce"."catalogs" DROP COLUMN "priority";--> statement-breakpoint
ALTER TABLE "commerce"."orders" DROP COLUMN "channel_id";--> statement-breakpoint
ALTER TABLE "commerce"."catalog_listing_channel_exclusions" ADD CONSTRAINT "uq_catalog_listing_channel_exclusions" UNIQUE("catalog_listing_id","catalog_channel_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_channels_catalog" ON "commerce"."catalog_channels" ("catalog_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_channels_resolve" ON "commerce"."catalog_channels" ("type","organization_id","legal_entity_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_listing_channel_exclusions_channel" ON "commerce"."catalog_listing_channel_exclusions" ("catalog_channel_id");--> statement-breakpoint
ALTER TABLE "commerce"."catalog_channels" ADD CONSTRAINT "catalog_channels_catalog_id_catalogs_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "commerce"."catalogs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."catalog_channels" ADD CONSTRAINT "catalog_channels_terminal_id_pos_terminals_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "commerce"."pos_terminals"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."catalog_listing_channel_exclusions" ADD CONSTRAINT "catalog_listing_channel_exclusions_XuZwSQKzpJWV_fkey" FOREIGN KEY ("catalog_channel_id") REFERENCES "commerce"."catalog_channels"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."catalog_channels" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
DROP TYPE "commerce"."sales_channel_kind";