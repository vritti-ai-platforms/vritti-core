DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'storage_location_role'
      AND n.nspname = 'vritti_core'
  ) THEN
    CREATE TYPE "vritti_core"."storage_location_role" AS ENUM ('STORAGE', 'POS');
  END IF;
END
$$;

ALTER TABLE "vritti_core"."storage_locations"
  ADD COLUMN "location_role" "vritti_core"."storage_location_role" NOT NULL DEFAULT 'STORAGE';
