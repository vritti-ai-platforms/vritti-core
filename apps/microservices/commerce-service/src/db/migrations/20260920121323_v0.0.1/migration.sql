CREATE POLICY "offering_owner_insert" ON "commerce"."offering_dimension_values" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (exists (select 1 from commerce.offering_dimensions p join commerce.offerings o on o.id = p.offering_id where p.id = dimension_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    else o.legal_entity_id is null and o.site_id is null
  end));--> statement-breakpoint
CREATE POLICY "offering_owner_update" ON "commerce"."offering_dimension_values" AS RESTRICTIVE FOR UPDATE TO public USING (exists (select 1 from commerce.offering_dimensions p join commerce.offerings o on o.id = p.offering_id where p.id = dimension_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    else o.legal_entity_id is null and o.site_id is null
  end));--> statement-breakpoint
CREATE POLICY "offering_owner_delete" ON "commerce"."offering_dimension_values" AS RESTRICTIVE FOR DELETE TO public USING (exists (select 1 from commerce.offering_dimensions p join commerce.offerings o on o.id = p.offering_id where p.id = dimension_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    else o.legal_entity_id is null and o.site_id is null
  end));--> statement-breakpoint
CREATE POLICY "offering_owner_insert" ON "commerce"."offering_dimensions" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (exists (select 1 from commerce.offerings o where o.id = offering_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    else o.legal_entity_id is null and o.site_id is null
  end));--> statement-breakpoint
CREATE POLICY "offering_owner_update" ON "commerce"."offering_dimensions" AS RESTRICTIVE FOR UPDATE TO public USING (exists (select 1 from commerce.offerings o where o.id = offering_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    else o.legal_entity_id is null and o.site_id is null
  end));--> statement-breakpoint
CREATE POLICY "offering_owner_delete" ON "commerce"."offering_dimensions" AS RESTRICTIVE FOR DELETE TO public USING (exists (select 1 from commerce.offerings o where o.id = offering_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    else o.legal_entity_id is null and o.site_id is null
  end));--> statement-breakpoint
CREATE POLICY "offering_owner_insert" ON "commerce"."offering_bom" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (exists (select 1 from commerce.offering_variants p join commerce.offerings o on o.id = p.offering_id where p.id = variant_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    else o.legal_entity_id is null and o.site_id is null
  end));--> statement-breakpoint
CREATE POLICY "offering_owner_update" ON "commerce"."offering_bom" AS RESTRICTIVE FOR UPDATE TO public USING (exists (select 1 from commerce.offering_variants p join commerce.offerings o on o.id = p.offering_id where p.id = variant_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    else o.legal_entity_id is null and o.site_id is null
  end));--> statement-breakpoint
CREATE POLICY "offering_owner_delete" ON "commerce"."offering_bom" AS RESTRICTIVE FOR DELETE TO public USING (exists (select 1 from commerce.offering_variants p join commerce.offerings o on o.id = p.offering_id where p.id = variant_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    else o.legal_entity_id is null and o.site_id is null
  end));--> statement-breakpoint
CREATE POLICY "offering_owner_insert" ON "commerce"."offering_variant_values" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (exists (select 1 from commerce.offering_variants p join commerce.offerings o on o.id = p.offering_id where p.id = variant_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    else o.legal_entity_id is null and o.site_id is null
  end));--> statement-breakpoint
CREATE POLICY "offering_owner_update" ON "commerce"."offering_variant_values" AS RESTRICTIVE FOR UPDATE TO public USING (exists (select 1 from commerce.offering_variants p join commerce.offerings o on o.id = p.offering_id where p.id = variant_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    else o.legal_entity_id is null and o.site_id is null
  end));--> statement-breakpoint
CREATE POLICY "offering_owner_delete" ON "commerce"."offering_variant_values" AS RESTRICTIVE FOR DELETE TO public USING (exists (select 1 from commerce.offering_variants p join commerce.offerings o on o.id = p.offering_id where p.id = variant_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    else o.legal_entity_id is null and o.site_id is null
  end));--> statement-breakpoint
CREATE POLICY "offering_owner_insert" ON "commerce"."offering_variants" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (exists (select 1 from commerce.offerings o where o.id = offering_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    else o.legal_entity_id is null and o.site_id is null
  end));--> statement-breakpoint
CREATE POLICY "offering_owner_update" ON "commerce"."offering_variants" AS RESTRICTIVE FOR UPDATE TO public USING (exists (select 1 from commerce.offerings o where o.id = offering_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    else o.legal_entity_id is null and o.site_id is null
  end));--> statement-breakpoint
CREATE POLICY "offering_owner_delete" ON "commerce"."offering_variants" AS RESTRICTIVE FOR DELETE TO public USING (exists (select 1 from commerce.offerings o where o.id = offering_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    else o.legal_entity_id is null and o.site_id is null
  end));--> statement-breakpoint
DROP POLICY "offering_reach" ON "commerce"."offering_dimension_values";--> statement-breakpoint
CREATE POLICY "offering_reach" ON "commerce"."offering_dimension_values" AS RESTRICTIVE FOR SELECT TO public USING (exists (select 1 from commerce.offering_dimensions p where p.id = dimension_id));--> statement-breakpoint
DROP POLICY "offering_reach" ON "commerce"."offering_dimensions";--> statement-breakpoint
CREATE POLICY "offering_reach" ON "commerce"."offering_dimensions" AS RESTRICTIVE FOR SELECT TO public USING (exists (select 1 from commerce.offerings o where o.id = offering_id));--> statement-breakpoint
DROP POLICY "offering_reach" ON "commerce"."offering_bom";--> statement-breakpoint
CREATE POLICY "offering_reach" ON "commerce"."offering_bom" AS RESTRICTIVE FOR SELECT TO public USING (exists (select 1 from commerce.offering_variants p where p.id = variant_id));--> statement-breakpoint
DROP POLICY "offering_reach" ON "commerce"."offering_variant_values";--> statement-breakpoint
CREATE POLICY "offering_reach" ON "commerce"."offering_variant_values" AS RESTRICTIVE FOR SELECT TO public USING (exists (select 1 from commerce.offering_variants p where p.id = variant_id));--> statement-breakpoint
DROP POLICY "offering_reach" ON "commerce"."offering_variants";--> statement-breakpoint
CREATE POLICY "offering_reach" ON "commerce"."offering_variants" AS RESTRICTIVE FOR SELECT TO public USING (exists (select 1 from commerce.offerings o where o.id = offering_id));