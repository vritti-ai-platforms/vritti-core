WITH RECURSIVE tree AS (
  SELECT
    s.id,
    s.parent_id,
    COALESCE(
      NULLIF(
        regexp_replace(
          regexp_replace(lower(s.code), '[^a-z0-9_]+', '_', 'g'),
          '(^_+|_+$)',
          '',
          'g'
        ),
        ''
      ),
      'loc'
    ) AS path_text
  FROM vritti_core.storage_locations s
  WHERE s.parent_id IS NULL

  UNION ALL

  SELECT
    c.id,
    c.parent_id,
    tree.path_text || '.' || COALESCE(
      NULLIF(
        regexp_replace(
          regexp_replace(lower(c.code), '[^a-z0-9_]+', '_', 'g'),
          '(^_+|_+$)',
          '',
          'g'
        ),
        ''
      ),
      'loc'
    ) AS path_text
  FROM vritti_core.storage_locations c
  JOIN tree ON c.parent_id = tree.id
)
UPDATE vritti_core.storage_locations s
SET path = tree.path_text::vritti_core.ltree
FROM tree
WHERE s.id = tree.id
  AND s.path::text <> tree.path_text;
