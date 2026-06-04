-- Enforce supplier_items.currency_code == suppliers.currency_code at the DB level.
--
-- Service-layer guards reject drift on add/update, but ad-hoc seed scripts have written mismatched
-- rows in the past (Oman Cold Chain items tagged INR when supplier was OMR). This is the last line
-- of defense regardless of write path.
--
-- Composite FK needs a UNIQUE target on suppliers(id, currency_code). `id` is the PK so this adds
-- no new uniqueness — Postgres just requires the FK target columns to form a UNIQUE/PK constraint.
--
-- The original single-column FK from supplier_items.supplier_id → suppliers.id is replaced by this
-- composite FK. The composite implicitly enforces the supplier_id existence check (you can't have
-- a (supplier_id, currency_code) pair without a matching supplier_id). Keeping both would cause
-- conflicting delete actions.
--
-- ON UPDATE CASCADE — supplier currency change auto-propagates to children (used by changeCurrency).
-- ON DELETE CASCADE — preserves the original behavior (deleting supplier removes its items).

ALTER TABLE "vritti_core"."suppliers"
  ADD CONSTRAINT "uq_suppliers_id_currency" UNIQUE (id, currency_code);--> statement-breakpoint

ALTER TABLE "vritti_core"."supplier_items"
  DROP CONSTRAINT IF EXISTS "supplier_items_supplier_id_suppliers_id_fkey";--> statement-breakpoint

ALTER TABLE "vritti_core"."supplier_items"
  ADD CONSTRAINT "fk_supplier_items_supplier_currency"
  FOREIGN KEY (supplier_id, currency_code)
  REFERENCES "vritti_core"."suppliers" (id, currency_code)
  ON UPDATE CASCADE
  ON DELETE CASCADE;
