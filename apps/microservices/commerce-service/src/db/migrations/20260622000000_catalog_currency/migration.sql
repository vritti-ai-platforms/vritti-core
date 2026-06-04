-- Catalog snapshots the BU currency at creation. Sell-side money (offering variant prices,
-- POS sellables) is read from this currency_code and serialized as {currency, value} (major units).
-- The gateway injects the active BU's currency on catalogs.create.
-- No production data to preserve; dev rows are backfilled to 'INR' then the default is dropped.

ALTER TABLE "vritti_core"."catalogs" ADD COLUMN "currency_code" varchar(3) NOT NULL DEFAULT 'INR';--> statement-breakpoint
ALTER TABLE "vritti_core"."catalogs" ALTER COLUMN "currency_code" DROP DEFAULT;--> statement-breakpoint

-- ============================================================================
-- Re-run the schema-wide grant so the app role can reach the altered table
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "vritti_core" TO "vritti_core_app";--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "vritti_core" TO "vritti_core_app";
