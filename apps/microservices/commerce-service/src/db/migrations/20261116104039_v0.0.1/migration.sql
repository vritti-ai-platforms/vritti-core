CREATE TYPE "commerce"."replenishment_method" AS ENUM('MANUAL', 'REORDER_POINT');--> statement-breakpoint
CREATE TYPE "commerce"."site_item_status" AS ENUM('ACTIVE', 'BLOCKED');--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_site_stock_levels" RENAME TO "inventory_item_sites";--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_sites" RENAME COLUMN "max_stock_level" TO "max_stock";--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_sites" ADD COLUMN "status" "commerce"."site_item_status" DEFAULT 'ACTIVE'::"commerce"."site_item_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_sites" ADD COLUMN "blocked_reason" text;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_sites" ADD COLUMN "blocked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_sites" ADD COLUMN "replenishment" "commerce"."replenishment_method" DEFAULT 'REORDER_POINT'::"commerce"."replenishment_method" NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_sites" ALTER COLUMN "reorder_point" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_sites" ALTER COLUMN "reorder_point" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_sites" ALTER COLUMN "max_stock" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_sites" ALTER COLUMN "max_stock" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_sites" ALTER COLUMN "safety_stock" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_sites" ALTER COLUMN "safety_stock" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_sites" RENAME CONSTRAINT "uq_inventory_item_site_stock_levels" TO "uq_inventory_item_sites";--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_sites" ADD CONSTRAINT "inventory_item_sites_replenishment_chk" CHECK (case "replenishment"
        when 'MANUAL' then "safety_stock" is null and "reorder_point" is null and "max_stock" is null
        else "reorder_point" > 0 and "max_stock" >= "reorder_point"
          and ("safety_stock" is null or ("safety_stock" >= 0 and "safety_stock" <= "reorder_point"))
      end);--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_sites" ADD CONSTRAINT "inventory_item_sites_blocked_chk" CHECK ("status" <> 'BLOCKED' or "blocked_reason" is not null);