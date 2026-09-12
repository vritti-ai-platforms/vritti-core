ALTER POLICY "reach_read" ON "commerce"."offering_dimension_templates" TO public USING (
        -- upward: org-owned rows are visible from every workspace
        (legal_entity_id is null and site_id is null)
        -- downward: the org workspace sees every row in the organization
        or (cast(nullif(current_setting('app.le_id', true), '') as uuid) is null and cast(nullif(current_setting('app.site_id', true), '') as uuid) is null)
        -- upward: my legal entity's own rows, whether I am that LE or a site beneath it
        or (site_id is null and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid))
        -- downward: an LE workspace also sees the rows its sites own
        or (cast(nullif(current_setting('app.site_id', true), '') as uuid) is null and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid))
        -- my own site's rows (a sibling site's are never visible)
        or site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid));