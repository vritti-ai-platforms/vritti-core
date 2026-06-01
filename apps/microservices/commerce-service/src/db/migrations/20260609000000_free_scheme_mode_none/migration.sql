-- Add 'none' to free_scheme_mode and make scheme_mode NOT NULL DEFAULT 'none'.
-- The enum is recreated (instead of ALTER TYPE ... ADD VALUE) so the new value is usable within the
-- same migration transaction. Only supplier_items, purchase_order_items, goods_receipt_items use it.

ALTER TABLE "vritti_core"."supplier_items" ALTER COLUMN "scheme_mode" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_order_items" ALTER COLUMN "scheme_mode" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_items" ALTER COLUMN "scheme_mode" DROP DEFAULT;--> statement-breakpoint

ALTER TYPE "vritti_core"."free_scheme_mode" RENAME TO "free_scheme_mode_old";--> statement-breakpoint
CREATE TYPE "vritti_core"."free_scheme_mode" AS ENUM ('none', 'slab', 'pro_rata');--> statement-breakpoint

ALTER TABLE "vritti_core"."supplier_items"
  ALTER COLUMN "scheme_mode" TYPE "vritti_core"."free_scheme_mode"
  USING "scheme_mode"::text::"vritti_core"."free_scheme_mode";--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_order_items"
  ALTER COLUMN "scheme_mode" TYPE "vritti_core"."free_scheme_mode"
  USING "scheme_mode"::text::"vritti_core"."free_scheme_mode";--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_items"
  ALTER COLUMN "scheme_mode" TYPE "vritti_core"."free_scheme_mode"
  USING "scheme_mode"::text::"vritti_core"."free_scheme_mode";--> statement-breakpoint

DROP TYPE "vritti_core"."free_scheme_mode_old";--> statement-breakpoint

UPDATE "vritti_core"."supplier_items" SET "scheme_mode" = 'none' WHERE "scheme_mode" IS NULL;--> statement-breakpoint
UPDATE "vritti_core"."purchase_order_items" SET "scheme_mode" = 'none' WHERE "scheme_mode" IS NULL;--> statement-breakpoint
UPDATE "vritti_core"."goods_receipt_items" SET "scheme_mode" = 'none' WHERE "scheme_mode" IS NULL;--> statement-breakpoint

ALTER TABLE "vritti_core"."supplier_items" ALTER COLUMN "scheme_mode" SET DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_items" ALTER COLUMN "scheme_mode" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_order_items" ALTER COLUMN "scheme_mode" SET DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_order_items" ALTER COLUMN "scheme_mode" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_items" ALTER COLUMN "scheme_mode" SET DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_items" ALTER COLUMN "scheme_mode" SET NOT NULL;
