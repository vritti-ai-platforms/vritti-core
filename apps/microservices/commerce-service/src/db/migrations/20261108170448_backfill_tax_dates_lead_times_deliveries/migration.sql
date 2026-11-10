UPDATE "commerce"."supplier_items" SET "default_lead_time_days" = 0 WHERE "default_lead_time_days" IS NULL;--> statement-breakpoint
UPDATE "commerce"."supplier_site_items" AS ssi SET "lead_time_days" = coalesce(
  CASE WHEN ssi."is_lead_time_overridden" THEN ssi."lead_time_days" END,
  (SELECT si."default_lead_time_days" FROM "commerce"."supplier_items" AS si WHERE si."id" = ssi."supplier_item_id"),
  0
) WHERE ssi."lead_time_days" IS NULL;--> statement-breakpoint
UPDATE "commerce"."purchase_orders" SET "tax_date" = "order_date" WHERE "tax_date" IS NULL;--> statement-breakpoint
UPDATE "commerce"."purchase_order_items" AS poi SET
  "tax_date" = coalesce(poi."tax_date", po."tax_date"),
  "expected_delivery_date" = coalesce(
    poi."expected_delivery_date",
    greatest(coalesce((po."expected_by" AT TIME ZONE po."timezone")::date, po."order_date"), po."order_date")
  )
FROM "commerce"."purchase_orders" AS po
WHERE po."id" = poi."purchase_order_id" AND (poi."tax_date" IS NULL OR poi."expected_delivery_date" IS NULL);--> statement-breakpoint
UPDATE "commerce"."supplier_invoices" SET "tax_date" = "invoice_date" WHERE "tax_date" IS NULL;
