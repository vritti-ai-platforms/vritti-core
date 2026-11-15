ALTER POLICY "reach_read" ON "commerce"."supplier_quotations" TO public USING (
  case
    -- a site: org-owned rows, its own LE's rows, its own rows
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then (legal_entity_id is null and site_id is null)
      or (site_id is null and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and (id in (select l.quotation_id from commerce.supplier_quotation_sites l) or purchase_id in (select l.id from commerce.purchases l)))
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
  end);