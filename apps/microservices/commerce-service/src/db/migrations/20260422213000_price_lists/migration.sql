CREATE TABLE IF NOT EXISTS "vritti_core"."price_lists" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
  "business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
  "name" varchar(100) NOT NULL,
  "code" varchar(50) NOT NULL,
  "description" varchar(500),
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "vritti_core"."price_lists" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_price_lists_bu_code'
      AND conrelid = 'vritti_core.price_lists'::regclass
  ) THEN
    ALTER TABLE "vritti_core"."price_lists"
      ADD CONSTRAINT "uq_price_lists_bu_code" UNIQUE ("business_unit_id", "code");
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_price_lists_bu"
  ON "vritti_core"."price_lists" USING btree ("organization_id", "business_unit_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vritti_core' AND tablename = 'price_lists' AND policyname = 'org_isolation'
  ) THEN
    CREATE POLICY "org_isolation" ON "vritti_core"."price_lists"
      AS PERMISSIVE FOR ALL
      USING (organization_id = current_setting('app.org_id', true)::uuid);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vritti_core' AND tablename = 'price_lists' AND policyname = 'bu_ancestor_read'
  ) THEN
    CREATE POLICY "bu_ancestor_read" ON "vritti_core"."price_lists"
      AS PERMISSIVE FOR SELECT
      USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vritti_core' AND tablename = 'price_lists' AND policyname = 'bu_write'
  ) THEN
    CREATE POLICY "bu_write" ON "vritti_core"."price_lists"
      AS PERMISSIVE FOR INSERT
      WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vritti_core' AND tablename = 'price_lists' AND policyname = 'bu_update'
  ) THEN
    CREATE POLICY "bu_update" ON "vritti_core"."price_lists"
      AS PERMISSIVE FOR UPDATE
      USING (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vritti_core' AND tablename = 'price_lists' AND policyname = 'bu_delete'
  ) THEN
    CREATE POLICY "bu_delete" ON "vritti_core"."price_lists"
      AS PERMISSIVE FOR DELETE
      USING (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "vritti_core"."price_list_items" (
  "organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
  "business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
  "price_list_id" uuid NOT NULL,
  "item_variant_id" uuid NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_visible" boolean DEFAULT true NOT NULL,
  "price_override" bigint,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("price_list_id", "item_variant_id")
);

ALTER TABLE "vritti_core"."price_list_items" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'price_list_items_price_list_id_price_lists_id_fkey'
      AND conrelid = 'vritti_core.price_list_items'::regclass
  ) THEN
    ALTER TABLE "vritti_core"."price_list_items"
      ADD CONSTRAINT "price_list_items_price_list_id_price_lists_id_fkey"
      FOREIGN KEY ("price_list_id")
      REFERENCES "vritti_core"."price_lists"("id")
      ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'price_list_items_item_variant_id_item_variants_id_fkey'
      AND conrelid = 'vritti_core.price_list_items'::regclass
  ) THEN
    ALTER TABLE "vritti_core"."price_list_items"
      ADD CONSTRAINT "price_list_items_item_variant_id_item_variants_id_fkey"
      FOREIGN KEY ("item_variant_id")
      REFERENCES "vritti_core"."item_variants"("id")
      ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_price_list_items_price_list"
  ON "vritti_core"."price_list_items" USING btree ("price_list_id");

CREATE INDEX IF NOT EXISTS "idx_price_list_items_variant"
  ON "vritti_core"."price_list_items" USING btree ("item_variant_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vritti_core' AND tablename = 'price_list_items' AND policyname = 'org_isolation'
  ) THEN
    CREATE POLICY "org_isolation" ON "vritti_core"."price_list_items"
      AS PERMISSIVE FOR ALL
      USING (organization_id = current_setting('app.org_id', true)::uuid);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vritti_core' AND tablename = 'price_list_items' AND policyname = 'bu_ancestor_read'
  ) THEN
    CREATE POLICY "bu_ancestor_read" ON "vritti_core"."price_list_items"
      AS PERMISSIVE FOR SELECT
      USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vritti_core' AND tablename = 'price_list_items' AND policyname = 'bu_write'
  ) THEN
    CREATE POLICY "bu_write" ON "vritti_core"."price_list_items"
      AS PERMISSIVE FOR INSERT
      WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vritti_core' AND tablename = 'price_list_items' AND policyname = 'bu_update'
  ) THEN
    CREATE POLICY "bu_update" ON "vritti_core"."price_list_items"
      AS PERMISSIVE FOR UPDATE
      USING (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vritti_core' AND tablename = 'price_list_items' AND policyname = 'bu_delete'
  ) THEN
    CREATE POLICY "bu_delete" ON "vritti_core"."price_list_items"
      AS PERMISSIVE FOR DELETE
      USING (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "vritti_core"."terminal_price_lists" (
  "organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
  "business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
  "terminal_id" uuid NOT NULL,
  "price_list_id" uuid NOT NULL,
  "priority" integer DEFAULT 0 NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("terminal_id", "price_list_id")
);

ALTER TABLE "vritti_core"."terminal_price_lists" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'terminal_price_lists_terminal_id_pos_terminals_id_fkey'
      AND conrelid = 'vritti_core.terminal_price_lists'::regclass
  ) THEN
    ALTER TABLE "vritti_core"."terminal_price_lists"
      ADD CONSTRAINT "terminal_price_lists_terminal_id_pos_terminals_id_fkey"
      FOREIGN KEY ("terminal_id")
      REFERENCES "vritti_core"."pos_terminals"("id")
      ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'terminal_price_lists_price_list_id_price_lists_id_fkey'
      AND conrelid = 'vritti_core.terminal_price_lists'::regclass
  ) THEN
    ALTER TABLE "vritti_core"."terminal_price_lists"
      ADD CONSTRAINT "terminal_price_lists_price_list_id_price_lists_id_fkey"
      FOREIGN KEY ("price_list_id")
      REFERENCES "vritti_core"."price_lists"("id")
      ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_terminal_price_lists_terminal"
  ON "vritti_core"."terminal_price_lists" USING btree ("terminal_id");

CREATE INDEX IF NOT EXISTS "idx_terminal_price_lists_price_list"
  ON "vritti_core"."terminal_price_lists" USING btree ("price_list_id");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_terminal_price_lists_default"
  ON "vritti_core"."terminal_price_lists" ("terminal_id")
  WHERE is_default = true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vritti_core' AND tablename = 'terminal_price_lists' AND policyname = 'org_isolation'
  ) THEN
    CREATE POLICY "org_isolation" ON "vritti_core"."terminal_price_lists"
      AS PERMISSIVE FOR ALL
      USING (organization_id = current_setting('app.org_id', true)::uuid);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vritti_core' AND tablename = 'terminal_price_lists' AND policyname = 'bu_ancestor_read'
  ) THEN
    CREATE POLICY "bu_ancestor_read" ON "vritti_core"."terminal_price_lists"
      AS PERMISSIVE FOR SELECT
      USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vritti_core' AND tablename = 'terminal_price_lists' AND policyname = 'bu_write'
  ) THEN
    CREATE POLICY "bu_write" ON "vritti_core"."terminal_price_lists"
      AS PERMISSIVE FOR INSERT
      WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vritti_core' AND tablename = 'terminal_price_lists' AND policyname = 'bu_update'
  ) THEN
    CREATE POLICY "bu_update" ON "vritti_core"."terminal_price_lists"
      AS PERMISSIVE FOR UPDATE
      USING (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vritti_core' AND tablename = 'terminal_price_lists' AND policyname = 'bu_delete'
  ) THEN
    CREATE POLICY "bu_delete" ON "vritti_core"."terminal_price_lists"
      AS PERMISSIVE FOR DELETE
      USING (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;
END
$$;
