ALTER TABLE "core"."apps" ADD COLUMN "permissions" jsonb DEFAULT '{}' NOT NULL;
--> statement-breakpoint
-- Seeds every credential that already exists with what the storefront signup actually
-- calls, so enforcement arriving does not break a working app. The prerequisites are
-- included deliberately: `add` resolves to nothing without `view`, and
-- `communications.add` without `communications.view`, so a grant naming only the two
-- write actions would silently deny both.
--
-- Keyed under `app`, not `web`: resolution reads the app bucket, so a web-keyed grant would
-- resolve to nothing. Narrow these in cloud-web afterwards; new credentials start empty and inert.
UPDATE "core"."apps"
   SET "permissions" = '{"people":{"app":["view","add","communications.view","communications.add"]}}'::jsonb
 WHERE "permissions" = '{}'::jsonb;
