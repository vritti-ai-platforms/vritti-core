-- Custom SQL migration file, put your code below! --

UPDATE "core"."organizations"
   SET "logo_light_url" = "logo_url",
       "logo_dark_url" = "logo_url"
 WHERE "logo_url" IS NOT NULL;
