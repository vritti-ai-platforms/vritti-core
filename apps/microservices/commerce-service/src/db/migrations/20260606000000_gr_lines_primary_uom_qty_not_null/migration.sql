UPDATE "vritti_core"."goods_receipt_lines" SET "primary_uom_qty" = "quantity" WHERE "primary_uom_qty" IS NULL;
--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_lines" ALTER COLUMN "primary_uom_qty" SET NOT NULL;
