-- Backfills `code` for templates created before the column existed, slugged from `name`
-- (lowercase, non-alphanumerics collapsed to a single hyphen, edges trimmed) so it satisfies
-- offering_dimension_templates_code_chk.
--
-- `code` is unique per ORGANIZATION, not per owner, so two owners that both named a template
-- "Size" would collide. The row_number suffix disambiguates the later one deterministically by
-- creation order, leaving the oldest with the clean code.
with slugged as (
  select
    id,
    trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')) as base,
    organization_id,
    row_number() over (
      partition by organization_id, trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
      order by created_at
    ) as n
  from commerce.offering_dimension_templates
  where code is null
)
update commerce.offering_dimension_templates t
set code = case
             -- a name starting with a digit would fail the check constraint, so prefix it
             when slugged.base ~ '^[a-z]' then slugged.base
             else 'x-' || slugged.base
           end
           || case when slugged.n > 1 then '-' || slugged.n::text else '' end
from slugged
where t.id = slugged.id;
