ALTER TABLE "vritti_core"."purchase_orders"
  ALTER COLUMN "total_amount" TYPE bigint USING "total_amount"::bigint;

ALTER TABLE "vritti_core"."purchase_order_items"
  ALTER COLUMN "supplier_unit_price" TYPE bigint USING "supplier_unit_price"::bigint,
  ALTER COLUMN "unit_price" TYPE bigint USING "unit_price"::bigint,
  ALTER COLUMN "total_price" TYPE bigint USING "total_price"::bigint;

ALTER TABLE "vritti_core"."supplier_items"
  ALTER COLUMN "unit_price" TYPE bigint USING "unit_price"::bigint;

ALTER TABLE "vritti_core"."orders"
  ALTER COLUMN "subtotal" TYPE bigint USING "subtotal"::bigint,
  ALTER COLUMN "tax_amount" TYPE bigint USING "tax_amount"::bigint,
  ALTER COLUMN "service_charge" TYPE bigint USING "service_charge"::bigint,
  ALTER COLUMN "delivery_charge" TYPE bigint USING "delivery_charge"::bigint,
  ALTER COLUMN "discount_amount" TYPE bigint USING "discount_amount"::bigint,
  ALTER COLUMN "total_amount" TYPE bigint USING "total_amount"::bigint;

ALTER TABLE "vritti_core"."order_items"
  ALTER COLUMN "unit_price" TYPE bigint USING "unit_price"::bigint,
  ALTER COLUMN "tax_amount" TYPE bigint USING "tax_amount"::bigint,
  ALTER COLUMN "subtotal" TYPE bigint USING "subtotal"::bigint,
  ALTER COLUMN "total" TYPE bigint USING "total"::bigint;

ALTER TABLE "vritti_core"."order_item_modifiers"
  ALTER COLUMN "additional_price" TYPE bigint USING "additional_price"::bigint;

ALTER TABLE "vritti_core"."invoice_items"
  ALTER COLUMN "unit_price" TYPE bigint USING "unit_price"::bigint,
  ALTER COLUMN "tax_amount" TYPE bigint USING "tax_amount"::bigint,
  ALTER COLUMN "total" TYPE bigint USING "total"::bigint;

ALTER TABLE "vritti_core"."invoices"
  ALTER COLUMN "subtotal" TYPE bigint USING "subtotal"::bigint,
  ALTER COLUMN "tax_amount" TYPE bigint USING "tax_amount"::bigint,
  ALTER COLUMN "discount_amount" TYPE bigint USING "discount_amount"::bigint,
  ALTER COLUMN "total_amount" TYPE bigint USING "total_amount"::bigint,
  ALTER COLUMN "paid_amount" TYPE bigint USING "paid_amount"::bigint,
  ALTER COLUMN "balance" TYPE bigint USING "balance"::bigint;

ALTER TABLE "vritti_core"."credit_notes"
  ALTER COLUMN "amount" TYPE bigint USING "amount"::bigint,
  ALTER COLUMN "applied_amount" TYPE bigint USING "applied_amount"::bigint,
  ALTER COLUMN "remaining" TYPE bigint USING "remaining"::bigint;

ALTER TABLE "vritti_core"."credit_note_applications"
  ALTER COLUMN "amount" TYPE bigint USING "amount"::bigint;

ALTER TABLE "vritti_core"."payments"
  ALTER COLUMN "amount" TYPE bigint USING "amount"::bigint;

ALTER TABLE "vritti_core"."item_variants"
  ALTER COLUMN "price" TYPE bigint USING "price"::bigint;

ALTER TABLE "vritti_core"."modifier_options"
  ALTER COLUMN "additional_price" TYPE bigint USING "additional_price"::bigint;
