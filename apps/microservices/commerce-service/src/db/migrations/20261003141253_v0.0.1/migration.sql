ALTER TABLE "commerce"."catalog_channels" DROP CONSTRAINT "ck_catalog_channels_target_matches_type", ADD CONSTRAINT "ck_catalog_channels_target_matches_type" CHECK (case
            when "type" = 'POS' then "app_id" is null
            else "terminal_id" is null
          end);