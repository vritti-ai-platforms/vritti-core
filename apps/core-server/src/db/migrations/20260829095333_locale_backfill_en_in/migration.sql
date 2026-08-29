-- Custom SQL migration file, put your code below! --

-- 'en' was the column default and is not a selectable LocaleSelector option, so these rows render
-- a blank Locale field in the admin UI. Rewrite them before the default is dropped.
UPDATE "core"."users" SET "locale" = 'en-IN' WHERE "locale" = 'en';
