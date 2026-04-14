CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_categories_parent
ON core.categories (parent_id);

CREATE INDEX IF NOT EXISTS idx_categories_name_trgm
ON core.categories USING GIN (name gin_trgm_ops);
