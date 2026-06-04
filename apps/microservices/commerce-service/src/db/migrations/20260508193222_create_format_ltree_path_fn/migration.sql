-- Function: turn an ltree path into a human-readable breadcrumb.
-- "main.sales.rack_a.shelf_top" → "Main › Sales › Rack A › Shelf Top"
-- Marked IMMUTABLE so it can drive a STORED generated column on any ltree-bearing table.
CREATE OR REPLACE FUNCTION "vritti_core"."format_ltree_path"(p "vritti_core"."ltree")
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT array_to_string(
    ARRAY(
      SELECT initcap(replace(segment, '_', ' '))
      FROM unnest(string_to_array(p::text, '.')) AS segment
    ),
    ' › '
  )
$$;
