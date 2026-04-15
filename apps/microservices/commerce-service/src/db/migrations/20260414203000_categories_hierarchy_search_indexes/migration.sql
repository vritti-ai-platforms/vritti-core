DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Skipping pg_trgm extension creation due to insufficient privileges.';
  END;
END $$;

CREATE INDEX IF NOT EXISTS idx_categories_parent
ON vritti_core.categories (parent_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE INDEX IF NOT EXISTS idx_categories_name_trgm
    ON vritti_core.categories USING GIN (name gin_trgm_ops);
  ELSE
    RAISE NOTICE 'Skipping idx_categories_name_trgm because pg_trgm is unavailable.';
  END IF;
END $$;
