UPDATE "core"."organizations" AS o SET "country_code" = COALESCE(
  (SELECT le."country" FROM "core"."legal_entities" AS le WHERE le."organization_id" = o."id" ORDER BY le."created_at" LIMIT 1),
  'IN'
) WHERE o."country_code" IS NULL;
