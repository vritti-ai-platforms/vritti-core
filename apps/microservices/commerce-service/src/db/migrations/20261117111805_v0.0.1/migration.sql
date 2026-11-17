ALTER POLICY "owner_insert" ON "commerce"."supplier_items" TO public WITH CHECK ((exists (select 1 from commerce.suppliers o where o.id = supplier_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    else false
  end)) or (coalesce(cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null and exists (select 1 from commerce.supplier_enrollments l
    where l.supplier_id = supplier_items.supplier_id and l.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and l.is_active) and not exists (select 1 from commerce.site_purchasing_settings f
    where f.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and f.supplier_items_required) and not exists (select 1 from commerce.inventory_item_sites f
    where f.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and f.supplier_items_required and f.inventory_item_id = supplier_items.inventory_item_id), false)));