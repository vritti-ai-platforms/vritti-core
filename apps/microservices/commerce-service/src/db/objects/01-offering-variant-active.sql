-- Keeps offering_variants.is_offering_active in step with its offering's is_active.
--
-- Sellability is `is_active AND is_offering_active`: the variant's own flag is never touched by the
-- offering, so retiring an offering and bringing it back restores exactly the set that was selling
-- before instead of switching everything on.
--
-- Lives here rather than in the schema because Drizzle Kit has no trigger API — its `entities`
-- config lists triggers as planned, not shipped. This file is replayed in filename order on every
-- deploy by runMigrationsAndGrants, so a dropped trigger heals itself. Delete it once Drizzle
-- manages triggers natively.

CREATE OR REPLACE FUNCTION commerce.sync_variant_offering_active() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE commerce.offering_variants
  SET is_offering_active = NEW.is_active
  WHERE offering_id = NEW.id
    AND is_offering_active IS DISTINCT FROM NEW.is_active;
  RETURN NULL;
END
$$;

DROP TRIGGER IF EXISTS trg_offerings_sync_variant_active ON commerce.offerings;
CREATE TRIGGER trg_offerings_sync_variant_active
AFTER UPDATE OF is_active ON commerce.offerings
FOR EACH ROW
WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
EXECUTE FUNCTION commerce.sync_variant_offering_active();

-- A new variant inherits its parent's current status, so it is never born out of step.
CREATE OR REPLACE FUNCTION commerce.seed_variant_offering_active() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT o.is_active INTO NEW.is_offering_active
  FROM commerce.offerings o
  WHERE o.id = NEW.offering_id;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_offering_variants_seed_offering_active ON commerce.offering_variants;
CREATE TRIGGER trg_offering_variants_seed_offering_active
BEFORE INSERT ON commerce.offering_variants
FOR EACH ROW
EXECUTE FUNCTION commerce.seed_variant_offering_active();
