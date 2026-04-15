CREATE EXTENSION IF NOT EXISTS ltree WITH SCHEMA vritti_core;

ALTER TABLE vritti_core.storage_locations
  ADD COLUMN IF NOT EXISTS path vritti_core.ltree;

WITH RECURSIVE tree AS (
  SELECT
    s.id,
    s.parent_id,
    replace(s.id::text, '-', '') AS path_text
  FROM vritti_core.storage_locations s
  WHERE s.parent_id IS NULL

  UNION ALL

  SELECT
    c.id,
    c.parent_id,
    tree.path_text || '.' || replace(c.id::text, '-', '') AS path_text
  FROM vritti_core.storage_locations c
  JOIN tree ON c.parent_id = tree.id
)
UPDATE vritti_core.storage_locations s
SET path = tree.path_text::vritti_core.ltree
FROM tree
WHERE s.id = tree.id
  AND (s.path IS NULL OR s.path::text <> tree.path_text);

UPDATE vritti_core.storage_locations
SET path = replace(id::text, '-', '')::vritti_core.ltree
WHERE path IS NULL;

ALTER TABLE vritti_core.storage_locations
  ALTER COLUMN path SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_storage_locations_path_gist
  ON vritti_core.storage_locations USING gist (path);
