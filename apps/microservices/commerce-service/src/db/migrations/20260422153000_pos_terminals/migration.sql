CREATE TABLE IF NOT EXISTS "vritti_core"."pos_terminals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
  "business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
  "name" varchar(100) NOT NULL,
  "code" varchar(50) NOT NULL,
  "storage_location_id" uuid NOT NULL,
  "description" varchar(500),
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "vritti_core"."pos_terminals" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_pos_terminals_bu_code'
      AND conrelid = 'vritti_core.pos_terminals'::regclass
  ) THEN
    ALTER TABLE "vritti_core"."pos_terminals"
      ADD CONSTRAINT "uq_pos_terminals_bu_code" UNIQUE ("business_unit_id", "code");
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pos_terminals_storage_location_id_storage_locations_id_fkey'
      AND conrelid = 'vritti_core.pos_terminals'::regclass
  ) THEN
    ALTER TABLE "vritti_core"."pos_terminals"
      ADD CONSTRAINT "pos_terminals_storage_location_id_storage_locations_id_fkey"
      FOREIGN KEY ("storage_location_id")
      REFERENCES "vritti_core"."storage_locations"("id")
      ON DELETE RESTRICT;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_pos_terminals_bu"
  ON "vritti_core"."pos_terminals" USING btree ("organization_id", "business_unit_id");

CREATE INDEX IF NOT EXISTS "idx_pos_terminals_location"
  ON "vritti_core"."pos_terminals" USING btree ("storage_location_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'pos_terminals'
      AND policyname = 'org_isolation'
  ) THEN
    CREATE POLICY "org_isolation" ON "vritti_core"."pos_terminals"
      AS PERMISSIVE
      FOR ALL
      USING (organization_id = current_setting('app.org_id', true)::uuid);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'pos_terminals'
      AND policyname = 'bu_ancestor_read'
  ) THEN
    CREATE POLICY "bu_ancestor_read" ON "vritti_core"."pos_terminals"
      AS PERMISSIVE
      FOR SELECT
      USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'pos_terminals'
      AND policyname = 'bu_write'
  ) THEN
    CREATE POLICY "bu_write" ON "vritti_core"."pos_terminals"
      AS PERMISSIVE
      FOR INSERT
      WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'pos_terminals'
      AND policyname = 'bu_update'
  ) THEN
    CREATE POLICY "bu_update" ON "vritti_core"."pos_terminals"
      AS PERMISSIVE
      FOR UPDATE
      USING (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'pos_terminals'
      AND policyname = 'bu_delete'
  ) THEN
    CREATE POLICY "bu_delete" ON "vritti_core"."pos_terminals"
      AS PERMISSIVE
      FOR DELETE
      USING (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;
END
$$;
