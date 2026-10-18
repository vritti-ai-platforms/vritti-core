-- offering_variants.dimensions / .attributes are a rendered copy of the junction tables, replacing the
-- derived `name` column. Built here with the same two expressions the service assigns on every later write
-- (src/common/variant-facets.ts), so a row backfilled now and a row rewritten tomorrow read identically.
UPDATE "commerce"."offering_variants" v
SET
  "dimensions" = (
    SELECT coalesce(
      jsonb_agg(jsonb_build_object('code', f.code, 'label', f.label, 'values', f.values) ORDER BY f.sort_order),
      '[]'::jsonb
    )
    FROM (
      SELECT d."code" AS code,
             d."name" AS label,
             d."sort_order" AS sort_order,
             jsonb_agg(
               jsonb_build_object('code', dv."code", 'value', dv."value") ORDER BY dv."sort_order"
             ) AS values
      FROM "commerce"."offering_variant_values" vv
      JOIN "commerce"."offering_dimensions" d ON d."id" = vv."dimension_id"
      JOIN "commerce"."offering_dimension_values" dv ON dv."id" = vv."value_id"
      WHERE vv."variant_id" = v."id"
      GROUP BY d."id", d."code", d."name", d."sort_order"
    ) f
  ),
  "attributes" = (
    SELECT coalesce(
      jsonb_agg(jsonb_build_object('code', f.code, 'label', f.label, 'values', f.values) ORDER BY f.sort_order),
      '[]'::jsonb
    )
    FROM (
      SELECT a."code" AS code,
             a."name" AS label,
             a."sort_order" AS sort_order,
             jsonb_agg(
               jsonb_build_object('code', av."code", 'value', av."value") ORDER BY av."sort_order"
             ) AS values
      FROM "commerce"."offering_variant_attribute_values" va
      JOIN "commerce"."offering_attributes" a ON a."id" = va."attribute_id"
      JOIN "commerce"."offering_attribute_values" av ON av."id" = va."value_id"
      WHERE va."variant_id" = v."id"
      GROUP BY a."id", a."code", a."name", a."sort_order"
    ) f
  );
--> statement-breakpoint
-- order_items keeps one built name per line, a snapshot of what was sold. variant_name already began with
-- the offering name, so it is the fuller of the two; item_name covers the lines that never had one.
UPDATE "commerce"."order_items"
SET "name" = coalesce(nullif(btrim("variant_name"), ''), "item_name")
WHERE "name" IS NULL;
