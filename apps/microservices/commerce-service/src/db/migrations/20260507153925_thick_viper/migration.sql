ALTER TABLE "vritti_core"."supplier_items" ADD COLUMN "currency_code" varchar(3);--> statement-breakpoint
UPDATE "vritti_core"."supplier_items" si SET "currency_code" = s."currency_code" FROM "vritti_core"."suppliers" s WHERE si."supplier_id" = s."id";--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_items" ALTER COLUMN "currency_code" SET NOT NULL;
