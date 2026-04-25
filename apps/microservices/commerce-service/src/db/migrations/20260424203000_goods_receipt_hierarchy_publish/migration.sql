DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'vritti_core'
      AND t.typname = 'goods_receipt_status'
      AND e.enumlabel = 'POSTED'
  ) THEN
    ALTER TYPE "vritti_core"."goods_receipt_status" RENAME VALUE 'POSTED' TO 'PUBLISHED';
  END IF;
END $$;

ALTER TABLE "vritti_core"."goods_receipts"
  ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone;

CREATE TABLE IF NOT EXISTS "vritti_core"."goods_receipt_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
  "business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
  "goods_receipt_id" uuid NOT NULL,
  "purchase_order_item_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "vritti_core"."goods_receipt_batches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
  "business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
  "goods_receipt_line_id" uuid NOT NULL,
  "inventory_item_id" uuid NOT NULL,
  "location_id" uuid NOT NULL,
  "accepted_quantity" numeric(12,3) NOT NULL,
  "rejected_quantity" numeric(12,3) DEFAULT '0' NOT NULL,
  "rejection_reason" text,
  "is_balanced" boolean DEFAULT false NOT NULL,
  "manufacturing_date" timestamp with time zone,
  "expiry_date" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "vritti_core"."goods_receipt_batch_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
  "business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
  "goods_receipt_batch_id" uuid NOT NULL,
  "quantity" numeric(12,3) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'goods_receipt_lines_goods_receipt_id_goods_receipts_id_fk'
  ) THEN
    ALTER TABLE "vritti_core"."goods_receipt_lines"
      ADD CONSTRAINT "goods_receipt_lines_goods_receipt_id_goods_receipts_id_fk"
      FOREIGN KEY ("goods_receipt_id") REFERENCES "vritti_core"."goods_receipts"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'goods_receipt_lines_purchase_order_item_id_purchase_order_items_id_fk'
  ) THEN
    ALTER TABLE "vritti_core"."goods_receipt_lines"
      ADD CONSTRAINT "goods_receipt_lines_purchase_order_item_id_purchase_order_items_id_fk"
      FOREIGN KEY ("purchase_order_item_id") REFERENCES "vritti_core"."purchase_order_items"("id") ON DELETE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'goods_receipt_batches_goods_receipt_line_id_goods_receipt_lines_id_fk'
  ) THEN
    ALTER TABLE "vritti_core"."goods_receipt_batches"
      ADD CONSTRAINT "goods_receipt_batches_goods_receipt_line_id_goods_receipt_lines_id_fk"
      FOREIGN KEY ("goods_receipt_line_id") REFERENCES "vritti_core"."goods_receipt_lines"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'goods_receipt_batches_inventory_item_id_inventory_items_id_fk'
  ) THEN
    ALTER TABLE "vritti_core"."goods_receipt_batches"
      ADD CONSTRAINT "goods_receipt_batches_inventory_item_id_inventory_items_id_fk"
      FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'goods_receipt_batches_location_id_storage_locations_id_fk'
  ) THEN
    ALTER TABLE "vritti_core"."goods_receipt_batches"
      ADD CONSTRAINT "goods_receipt_batches_location_id_storage_locations_id_fk"
      FOREIGN KEY ("location_id") REFERENCES "vritti_core"."storage_locations"("id") ON DELETE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'goods_receipt_batch_items_goods_receipt_batch_id_goods_receipt_batches_id_fk'
  ) THEN
    ALTER TABLE "vritti_core"."goods_receipt_batch_items"
      ADD CONSTRAINT "goods_receipt_batch_items_goods_receipt_batch_id_goods_receipt_batches_id_fk"
      FOREIGN KEY ("goods_receipt_batch_id") REFERENCES "vritti_core"."goods_receipt_batches"("id") ON DELETE cascade;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_goods_receipt_lines_receipt"
  ON "vritti_core"."goods_receipt_lines" USING btree ("goods_receipt_id");
CREATE INDEX IF NOT EXISTS "idx_goods_receipt_lines_po_item"
  ON "vritti_core"."goods_receipt_lines" USING btree ("purchase_order_item_id");
CREATE INDEX IF NOT EXISTS "idx_goods_receipt_batches_line"
  ON "vritti_core"."goods_receipt_batches" USING btree ("goods_receipt_line_id");
CREATE INDEX IF NOT EXISTS "idx_goods_receipt_batches_inventory"
  ON "vritti_core"."goods_receipt_batches" USING btree ("inventory_item_id");
CREATE INDEX IF NOT EXISTS "idx_goods_receipt_batches_location"
  ON "vritti_core"."goods_receipt_batches" USING btree ("location_id");
CREATE INDEX IF NOT EXISTS "idx_goods_receipt_batch_items_batch"
  ON "vritti_core"."goods_receipt_batch_items" USING btree ("goods_receipt_batch_id");

ALTER TABLE "vritti_core"."goods_receipt_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vritti_core"."goods_receipt_batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vritti_core"."goods_receipt_batch_items" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'goods_receipt_lines'
      AND policyname = 'org_isolation'
  ) THEN
    CREATE POLICY "org_isolation"
      ON "vritti_core"."goods_receipt_lines"
      FOR ALL
      USING (organization_id = current_setting('app.org_id', true)::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'goods_receipt_lines'
      AND policyname = 'bu_ancestor_read'
  ) THEN
    CREATE POLICY "bu_ancestor_read"
      ON "vritti_core"."goods_receipt_lines"
      FOR SELECT
      USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'goods_receipt_lines'
      AND policyname = 'bu_write'
  ) THEN
    CREATE POLICY "bu_write"
      ON "vritti_core"."goods_receipt_lines"
      FOR INSERT
      WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'goods_receipt_lines'
      AND policyname = 'bu_update'
  ) THEN
    CREATE POLICY "bu_update"
      ON "vritti_core"."goods_receipt_lines"
      FOR UPDATE
      USING (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'goods_receipt_lines'
      AND policyname = 'bu_delete'
  ) THEN
    CREATE POLICY "bu_delete"
      ON "vritti_core"."goods_receipt_lines"
      FOR DELETE
      USING (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'goods_receipt_batches'
      AND policyname = 'org_isolation'
  ) THEN
    CREATE POLICY "org_isolation"
      ON "vritti_core"."goods_receipt_batches"
      FOR ALL
      USING (organization_id = current_setting('app.org_id', true)::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'goods_receipt_batches'
      AND policyname = 'bu_ancestor_read'
  ) THEN
    CREATE POLICY "bu_ancestor_read"
      ON "vritti_core"."goods_receipt_batches"
      FOR SELECT
      USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'goods_receipt_batches'
      AND policyname = 'bu_write'
  ) THEN
    CREATE POLICY "bu_write"
      ON "vritti_core"."goods_receipt_batches"
      FOR INSERT
      WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'goods_receipt_batches'
      AND policyname = 'bu_update'
  ) THEN
    CREATE POLICY "bu_update"
      ON "vritti_core"."goods_receipt_batches"
      FOR UPDATE
      USING (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'goods_receipt_batches'
      AND policyname = 'bu_delete'
  ) THEN
    CREATE POLICY "bu_delete"
      ON "vritti_core"."goods_receipt_batches"
      FOR DELETE
      USING (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'goods_receipt_batch_items'
      AND policyname = 'org_isolation'
  ) THEN
    CREATE POLICY "org_isolation"
      ON "vritti_core"."goods_receipt_batch_items"
      FOR ALL
      USING (organization_id = current_setting('app.org_id', true)::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'goods_receipt_batch_items'
      AND policyname = 'bu_ancestor_read'
  ) THEN
    CREATE POLICY "bu_ancestor_read"
      ON "vritti_core"."goods_receipt_batch_items"
      FOR SELECT
      USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'goods_receipt_batch_items'
      AND policyname = 'bu_write'
  ) THEN
    CREATE POLICY "bu_write"
      ON "vritti_core"."goods_receipt_batch_items"
      FOR INSERT
      WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'goods_receipt_batch_items'
      AND policyname = 'bu_update'
  ) THEN
    CREATE POLICY "bu_update"
      ON "vritti_core"."goods_receipt_batch_items"
      FOR UPDATE
      USING (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'goods_receipt_batch_items'
      AND policyname = 'bu_delete'
  ) THEN
    CREATE POLICY "bu_delete"
      ON "vritti_core"."goods_receipt_batch_items"
      FOR DELETE
      USING (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;
END $$;
