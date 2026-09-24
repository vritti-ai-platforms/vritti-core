ALTER POLICY "template_reach" ON "commerce"."dimension_template_values" RENAME TO "reach_read";--> statement-breakpoint
ALTER POLICY "template_owner_insert" ON "commerce"."dimension_template_values" RENAME TO "owner_insert";--> statement-breakpoint
ALTER POLICY "template_owner_update" ON "commerce"."dimension_template_values" RENAME TO "owner_update";--> statement-breakpoint
ALTER POLICY "template_owner_delete" ON "commerce"."dimension_template_values" RENAME TO "owner_delete";--> statement-breakpoint
ALTER POLICY "offering_reach" ON "commerce"."offering_dimension_values" RENAME TO "reach_read";--> statement-breakpoint
ALTER POLICY "offering_owner_insert" ON "commerce"."offering_dimension_values" RENAME TO "owner_insert";--> statement-breakpoint
ALTER POLICY "offering_owner_update" ON "commerce"."offering_dimension_values" RENAME TO "owner_update";--> statement-breakpoint
ALTER POLICY "offering_owner_delete" ON "commerce"."offering_dimension_values" RENAME TO "owner_delete";--> statement-breakpoint
ALTER POLICY "offering_reach" ON "commerce"."offering_dimensions" RENAME TO "reach_read";--> statement-breakpoint
ALTER POLICY "offering_owner_insert" ON "commerce"."offering_dimensions" RENAME TO "owner_insert";--> statement-breakpoint
ALTER POLICY "offering_owner_update" ON "commerce"."offering_dimensions" RENAME TO "owner_update";--> statement-breakpoint
ALTER POLICY "offering_owner_delete" ON "commerce"."offering_dimensions" RENAME TO "owner_delete";--> statement-breakpoint
ALTER POLICY "offering_reach" ON "commerce"."offering_bom" RENAME TO "reach_read";--> statement-breakpoint
ALTER POLICY "offering_owner_insert" ON "commerce"."offering_bom" RENAME TO "owner_insert";--> statement-breakpoint
ALTER POLICY "offering_owner_update" ON "commerce"."offering_bom" RENAME TO "owner_update";--> statement-breakpoint
ALTER POLICY "offering_owner_delete" ON "commerce"."offering_bom" RENAME TO "owner_delete";--> statement-breakpoint
ALTER POLICY "offering_reach" ON "commerce"."offering_variant_values" RENAME TO "reach_read";--> statement-breakpoint
ALTER POLICY "offering_owner_insert" ON "commerce"."offering_variant_values" RENAME TO "owner_insert";--> statement-breakpoint
ALTER POLICY "offering_owner_update" ON "commerce"."offering_variant_values" RENAME TO "owner_update";--> statement-breakpoint
ALTER POLICY "offering_owner_delete" ON "commerce"."offering_variant_values" RENAME TO "owner_delete";--> statement-breakpoint
ALTER POLICY "offering_reach" ON "commerce"."offering_variants" RENAME TO "reach_read";--> statement-breakpoint
ALTER POLICY "offering_owner_insert" ON "commerce"."offering_variants" RENAME TO "owner_insert";--> statement-breakpoint
ALTER POLICY "offering_owner_update" ON "commerce"."offering_variants" RENAME TO "owner_update";--> statement-breakpoint
ALTER POLICY "offering_owner_delete" ON "commerce"."offering_variants" RENAME TO "owner_delete";--> statement-breakpoint
ALTER POLICY "reach_read" ON "commerce"."dimension_template_values" TO public USING (exists (select 1 from commerce.dimension_templates o where o.id = template_id));--> statement-breakpoint
ALTER POLICY "owner_insert" ON "commerce"."dimension_template_values" TO public WITH CHECK (exists (select 1 from commerce.dimension_templates o where o.id = template_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    else o.legal_entity_id is null and o.site_id is null
  end));--> statement-breakpoint
ALTER POLICY "owner_update" ON "commerce"."dimension_template_values" TO public USING (exists (select 1 from commerce.dimension_templates o where o.id = template_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    else o.legal_entity_id is null and o.site_id is null
  end));--> statement-breakpoint
ALTER POLICY "owner_delete" ON "commerce"."dimension_template_values" TO public USING (exists (select 1 from commerce.dimension_templates o where o.id = template_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    else o.legal_entity_id is null and o.site_id is null
  end));