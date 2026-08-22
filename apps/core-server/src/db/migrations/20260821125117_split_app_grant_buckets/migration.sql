-- Re-keys legacy credential grants from the single `app` bucket to the credential's own surface.
--
-- Resolution already honours a stored `app` bucket at read time (normalizeApiBuckets reads it as
-- "either surface"), so this is cleanliness rather than correctness: after it, every stored grant
-- names the one bucket its credential can actually present. Idempotent — features without an
-- `app` key pass through untouched, and re-running finds nothing left to move.
UPDATE "core"."apps"
SET "permissions" = (
  SELECT COALESCE(
    jsonb_object_agg(
      feature.key,
      CASE
        WHEN NOT (feature.value ? 'app') THEN feature.value
        -- The surface bucket wins where both exist; otherwise the legacy value moves onto it
        WHEN "type" = 'GRAPHQL' THEN (feature.value - 'app') || jsonb_build_object(
          'graphql', COALESCE(feature.value -> 'graphql', feature.value -> 'app')
        )
        ELSE (feature.value - 'app') || jsonb_build_object(
          'http', COALESCE(feature.value -> 'http', feature.value -> 'app')
        )
      END
    ),
    '{}'::jsonb
  )
  FROM jsonb_each("permissions") AS feature
)
WHERE EXISTS (
  SELECT 1 FROM jsonb_each("permissions") AS feature WHERE feature.value ? 'app'
);
