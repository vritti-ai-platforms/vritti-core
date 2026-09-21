import { sql } from '@vritti/api-sdk/drizzle-orm';
import { pgPolicy, uuid } from '@vritti/api-sdk/drizzle-pg-core';

export const LE_GUC = "cast(nullif(current_setting('app.le_id', true), '') as uuid)";
export const SITE_GUC = "cast(nullif(current_setting('app.site_id', true), '') as uuid)";

const columns = (table?: string) => ({
  le: table ? `${table}.legal_entity_id` : 'legal_entity_id',
  site: table ? `${table}.site_id` : 'site_id',
});

const ancestorOrSelf = (table?: string) => {
  const { le, site } = columns(table);
  return `
  case
    when ${SITE_GUC} is not null then (${le} is null and ${site} is null)
      or (${le} = ${LE_GUC} and ${site} is null)
      or (${le} = ${LE_GUC} and ${site} = ${SITE_GUC})
    when ${LE_GUC} is not null then (${le} is null and ${site} is null)
      or (${le} = ${LE_GUC} and ${site} is null)
    else ${le} is null and ${site} is null
  end`;
};

const anywhereInWorkspaceTree = (table?: string) => {
  const { le, site } = columns(table);
  return `
        -- upward: org-owned rows are visible from every workspace
        (${le} is null and ${site} is null)
        -- downward: the org workspace sees every row in the organization
        or (${LE_GUC} is null and ${SITE_GUC} is null)
        -- upward: my legal entity's own rows, whether I am that LE or a site beneath it
        or (${site} is null and ${le} = ${LE_GUC})
        -- downward: an LE workspace also sees the rows its sites own
        or (${SITE_GUC} is null and ${le} = ${LE_GUC})
        -- my own site's rows (a sibling site's are never visible)
        or ${site} = ${SITE_GUC}`;
};

const exactlyThisWorkspace = (table?: string) => {
  const { le, site } = columns(table);
  return `
  case
    when ${SITE_GUC} is not null then ${site} = ${SITE_GUC} and ${le} = ${LE_GUC}
    when ${LE_GUC} is not null then ${le} = ${LE_GUC} and ${site} is null
    else ${le} is null and ${site} is null
  end`;
};

export const ownedByWorkspace = (table?: string) =>
  sql<boolean>`coalesce(${sql.raw(exactlyThisWorkspace(table))}, false)`;

export const ownerMatchesWorkspaceSql = (table?: string) => exactlyThisWorkspace(table);

export const workspaceScopeColumns = {
  legalEntityId: uuid('legal_entity_id').default(sql.raw(LE_GUC)),
  siteId: uuid('site_id').default(sql.raw(SITE_GUC)),
};

export const organizationIdColumn = uuid('organization_id')
  .notNull()
  .default(sql.raw("cast(current_setting('app.org_id') as uuid)"));

const orgIsolation = () =>
  pgPolicy('org_isolation', {
    for: 'all',
    using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
  });

export const workspaceScopePolicies = (name: string) => {
  const reach = sql.raw(`coalesce(${ancestorOrSelf()}, false)`);
  const owned = sql.raw(`coalesce(${exactlyThisWorkspace()}, false)`);

  return [
    orgIsolation(),
    pgPolicy(name, { as: 'restrictive', for: 'select', using: reach }),
    pgPolicy(`${name}_insert`, { as: 'restrictive', for: 'insert', withCheck: owned }),
    pgPolicy(`${name}_update`, { as: 'restrictive', for: 'update', using: owned, withCheck: owned }),
    pgPolicy(`${name}_delete`, { as: 'restrictive', for: 'delete', using: owned }),
  ];
};

export const workspaceHierarchyPolicies = () => {
  const owned = sql.raw(exactlyThisWorkspace());

  return [
    orgIsolation(),
    pgPolicy('reach_read', { as: 'restrictive', for: 'select', using: sql.raw(anywhereInWorkspaceTree()) }),
    pgPolicy('owner_insert', { as: 'restrictive', for: 'insert', withCheck: owned }),
    pgPolicy('owner_update', { as: 'restrictive', for: 'update', using: owned }),
    pgPolicy('owner_delete', { as: 'restrictive', for: 'delete', using: owned }),
  ];
};
