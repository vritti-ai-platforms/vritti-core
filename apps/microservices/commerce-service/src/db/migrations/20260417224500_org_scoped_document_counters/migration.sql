CREATE TABLE IF NOT EXISTS "vritti_core"."document_counters" (
  "organization_id" uuid NOT NULL DEFAULT current_setting('app.org_id')::uuid,
  "counter_key" varchar(120) NOT NULL,
  "last_number" bigint NOT NULL DEFAULT 0,
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "document_counters_pkey" PRIMARY KEY ("organization_id", "counter_key")
);

ALTER TABLE "vritti_core"."document_counters" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_isolation" ON "vritti_core"."document_counters";
CREATE POLICY "org_isolation"
  ON "vritti_core"."document_counters"
  FOR ALL
  USING ("organization_id" = current_setting('app.org_id', true)::uuid)
  WITH CHECK ("organization_id" = current_setting('app.org_id', true)::uuid);

INSERT INTO "vritti_core"."document_counters" ("organization_id", "counter_key", "last_number", "updated_at")
SELECT
  i.organization_id,
  'ITEM',
  MAX(COALESCE((regexp_match(i.code, '([0-9]+)$'))[1]::bigint, 0)),
  now()
FROM "vritti_core"."items" i
GROUP BY i.organization_id
ON CONFLICT ("organization_id", "counter_key")
DO UPDATE SET
  "last_number" = GREATEST("vritti_core"."document_counters"."last_number", EXCLUDED."last_number"),
  "updated_at" = now();

INSERT INTO "vritti_core"."document_counters" ("organization_id", "counter_key", "last_number", "updated_at")
SELECT
  o.organization_id,
  'ORDER',
  MAX(COALESCE((regexp_match(o.order_number, '([0-9]+)$'))[1]::bigint, 0)),
  now()
FROM "vritti_core"."orders" o
GROUP BY o.organization_id
ON CONFLICT ("organization_id", "counter_key")
DO UPDATE SET
  "last_number" = GREATEST("vritti_core"."document_counters"."last_number", EXCLUDED."last_number"),
  "updated_at" = now();

INSERT INTO "vritti_core"."document_counters" ("organization_id", "counter_key", "last_number", "updated_at")
SELECT
  po.organization_id,
  'PO:' || COALESCE((regexp_match(po.po_number, '^PO-([0-9]{6})-'))[1], to_char(po.order_date, 'YYYYMM')),
  MAX(COALESCE((regexp_match(po.po_number, '([0-9]+)$'))[1]::bigint, 0)),
  now()
FROM "vritti_core"."purchase_orders" po
GROUP BY
  po.organization_id,
  COALESCE((regexp_match(po.po_number, '^PO-([0-9]{6})-'))[1], to_char(po.order_date, 'YYYYMM'))
ON CONFLICT ("organization_id", "counter_key")
DO UPDATE SET
  "last_number" = GREATEST("vritti_core"."document_counters"."last_number", EXCLUDED."last_number"),
  "updated_at" = now();

INSERT INTO "vritti_core"."document_counters" ("organization_id", "counter_key", "last_number", "updated_at")
SELECT
  sa.organization_id,
  'SA:' || COALESCE((regexp_match(sa.code, '^SA-([0-9]{6})-'))[1], to_char(sa.created_at, 'YYYYMM')),
  MAX(COALESCE((regexp_match(sa.code, '([0-9]+)$'))[1]::bigint, 0)),
  now()
FROM "vritti_core"."stock_adjustments" sa
GROUP BY
  sa.organization_id,
  COALESCE((regexp_match(sa.code, '^SA-([0-9]{6})-'))[1], to_char(sa.created_at, 'YYYYMM'))
ON CONFLICT ("organization_id", "counter_key")
DO UPDATE SET
  "last_number" = GREATEST("vritti_core"."document_counters"."last_number", EXCLUDED."last_number"),
  "updated_at" = now();

INSERT INTO "vritti_core"."document_counters" ("organization_id", "counter_key", "last_number", "updated_at")
SELECT
  b.organization_id,
  'BATCH:' || b.inventory_item_id::text || ':' ||
    COALESCE((regexp_match(b.batch_number, '-([0-9]{6})-[0-9]+$'))[1], to_char(COALESCE(b.manufacturing_date, b.created_at::date), 'YYMMDD')),
  MAX(COALESCE((regexp_match(b.batch_number, '([0-9]+)$'))[1]::bigint, 0)),
  now()
FROM "vritti_core"."inventory_item_batches" b
GROUP BY
  b.organization_id,
  b.inventory_item_id,
  COALESCE((regexp_match(b.batch_number, '-([0-9]{6})-[0-9]+$'))[1], to_char(COALESCE(b.manufacturing_date, b.created_at::date), 'YYMMDD'))
ON CONFLICT ("organization_id", "counter_key")
DO UPDATE SET
  "last_number" = GREATEST("vritti_core"."document_counters"."last_number", EXCLUDED."last_number"),
  "updated_at" = now();

DROP SEQUENCE IF EXISTS "vritti_core"."purchase_order_number_seq";
DROP SEQUENCE IF EXISTS "vritti_core"."stock_adjustment_code_seq";
DROP SEQUENCE IF EXISTS "vritti_core"."order_number_seq";
DROP SEQUENCE IF EXISTS "vritti_core"."item_code_seq";
DROP SEQUENCE IF EXISTS "vritti_core"."inventory_item_batch_number_seq";
