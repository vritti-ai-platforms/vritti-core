-- Create customers table for the POS module
-- and add a nullable customer_id FK on orders.

CREATE TABLE IF NOT EXISTS "vritti_core"."customers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
  "business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
  "name" varchar(255) NOT NULL,
  "phone" varchar(32),
  "email" varchar(255),
  "notes" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "vritti_core"."customers" ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS "idx_customers_bu"
  ON "vritti_core"."customers" USING btree ("organization_id", "business_unit_id");

CREATE INDEX IF NOT EXISTS "idx_customers_phone"
  ON "vritti_core"."customers" USING btree ("phone");

CREATE INDEX IF NOT EXISTS "idx_customers_email"
  ON "vritti_core"."customers" USING btree ("email");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'vritti_core'
      AND tablename = 'customers'
      AND policyname = 'org_isolation'
  ) THEN
    CREATE POLICY "org_isolation" ON "vritti_core"."customers"
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
      AND tablename = 'customers'
      AND policyname = 'bu_ancestor_read'
  ) THEN
    CREATE POLICY "bu_ancestor_read" ON "vritti_core"."customers"
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
      AND tablename = 'customers'
      AND policyname = 'bu_write'
  ) THEN
    CREATE POLICY "bu_write" ON "vritti_core"."customers"
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
      AND tablename = 'customers'
      AND policyname = 'bu_update'
  ) THEN
    CREATE POLICY "bu_update" ON "vritti_core"."customers"
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
      AND tablename = 'customers'
      AND policyname = 'bu_delete'
  ) THEN
    CREATE POLICY "bu_delete" ON "vritti_core"."customers"
      AS PERMISSIVE
      FOR DELETE
      USING (business_unit_id = current_setting('app.bu_id', true)::uuid);
  END IF;
END
$$;

-- Link orders to customers (nullable, set null on delete)
ALTER TABLE "vritti_core"."orders"
  ADD COLUMN IF NOT EXISTS "customer_id" uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_customer_id_customers_id_fkey'
      AND conrelid = 'vritti_core.orders'::regclass
  ) THEN
    ALTER TABLE "vritti_core"."orders"
      ADD CONSTRAINT "orders_customer_id_customers_id_fkey"
      FOREIGN KEY ("customer_id") REFERENCES "vritti_core"."customers"("id")
      ON DELETE SET NULL;
  END IF;
END
$$;
