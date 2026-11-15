ALTER TABLE "commerce"."supplier_quotation_sites" ADD COLUMN "owner_site_id" uuid;--> statement-breakpoint
CREATE INDEX "idx_supplier_quotation_sites_owner_site" ON "commerce"."supplier_quotation_sites" ("owner_site_id");--> statement-breakpoint
ALTER POLICY "owner_insert" ON "commerce"."supplier_quotation_items" TO public WITH CHECK (exists (select 1 from commerce.supplier_quotations o where o.id = quotation_id and coalesce((
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end) or (
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end), false)));--> statement-breakpoint
ALTER POLICY "owner_update" ON "commerce"."supplier_quotation_items" TO public USING (exists (select 1 from commerce.supplier_quotations o where o.id = quotation_id and coalesce((
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end) or (
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end), false)));--> statement-breakpoint
ALTER POLICY "owner_delete" ON "commerce"."supplier_quotation_items" TO public USING (exists (select 1 from commerce.supplier_quotations o where o.id = quotation_id and coalesce((
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end) or (
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end), false)));--> statement-breakpoint
ALTER POLICY "reach_read" ON "commerce"."supplier_quotation_sites" TO public USING (coalesce((
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then site_id = any(string_to_array(nullif(current_setting('app.site_ids', true), ''), ',')::uuid[])
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then true
    else false
  end) or (site_id is null and (
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then true
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then true
    else false
  end)), false) or (cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null and owner_site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid)));--> statement-breakpoint
ALTER POLICY "reach_read" ON "commerce"."supplier_quotations" TO public USING (
  case
    -- a site: org-owned rows, its own LE's rows, its own rows
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then (legal_entity_id is null and site_id is null)
      or (legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and (id in (select l.quotation_id from commerce.supplier_quotation_sites l)))
      or (site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid))
    -- a site group: org-owned rows plus whatever its member sites own, and nothing else
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then (legal_entity_id is null and site_id is null)
      or (site_id = any(string_to_array(nullif(current_setting('app.site_ids', true), ''), ',')::uuid[]))
    -- an LE: org-owned rows, its own rows, and everything its sites own
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then (legal_entity_id is null and site_id is null)
      or (legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid))
    -- the org workspace: every row in the organization
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then true
    else false
  end);--> statement-breakpoint
ALTER POLICY "owner_insert" ON "commerce"."supplier_quotations" TO public WITH CHECK (coalesce((
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then legal_entity_id is null and site_id is null
    else false
  end) or (
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end), false));--> statement-breakpoint
ALTER POLICY "owner_update" ON "commerce"."supplier_quotations" TO public USING (coalesce((
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then legal_entity_id is null and site_id is null
    else false
  end) or (
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end), false));--> statement-breakpoint
ALTER POLICY "owner_delete" ON "commerce"."supplier_quotations" TO public USING (coalesce((
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then legal_entity_id is null and site_id is null
    else false
  end) or (
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end), false));