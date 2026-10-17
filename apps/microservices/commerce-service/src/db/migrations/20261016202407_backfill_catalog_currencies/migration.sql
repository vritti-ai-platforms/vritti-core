-- Custom SQL migration file, put your code below! --

-- Every catalog already implies its currencies: the distinct currencies its listings are priced in.
-- Declaring them is therefore a derivation, not a guess, so no existing price becomes unreachable
-- the moment the application starts filtering by the declared list.
--
-- Ordered alphabetically for a deterministic first offer. A catalog with no prices yet gets no row:
-- it genuinely has not chosen a currency, and the next edit asks for one rather than inventing it.
INSERT INTO "commerce"."catalog_currencies" ("organization_id", "catalog_id", "currency_code", "sort_order")
SELECT d."organization_id",
       d."catalog_id",
       d."currency_code",
       (row_number() OVER (PARTITION BY d."catalog_id" ORDER BY d."currency_code")) - 1
  FROM (
        SELECT DISTINCT c."organization_id",
               c."id" AS "catalog_id",
               p."currency_code"
          FROM "commerce"."catalogs" c
          JOIN "commerce"."catalog_listings" l ON l."catalog_id" = c."id"
          JOIN "commerce"."catalog_listing_prices" p ON p."catalog_listing_id" = l."id"
       ) d
ON CONFLICT ("catalog_id", "currency_code") DO NOTHING;
