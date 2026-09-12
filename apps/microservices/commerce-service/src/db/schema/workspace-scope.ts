import { sql } from '@vritti/api-sdk/drizzle-orm';
import { pgPolicy, uuid } from '@vritti/api-sdk/drizzle-pg-core';

export const LE_GUC = "cast(nullif(current_setting('app.le_id', true), '') as uuid)";
export const SITE_GUC = "cast(nullif(current_setting('app.site_id', true), '') as uuid)";

// RLS evaluates against a single table, so the column names are bare there. A joined SELECT has to
// qualify them — pos_terminals also has a site_id, and Postgres will not guess.
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

const exactlyThisWorkspace = (table?: string) => {
  const { le, site } = columns(table);
  return `
  case
    when ${SITE_GUC} is not null then ${site} = ${SITE_GUC} and ${le} = ${LE_GUC}
    when ${LE_GUC} is not null then ${le} = ${LE_GUC} and ${site} is null
    else ${le} is null and ${site} is null
  end`;
};

// True when the row belongs to the workspace the caller is in, rather than one it inherits from.
// Pass the table name when the query joins anything that also has a site_id or legal_entity_id.
export const ownedByWorkspace = (table?: string) =>
  sql<boolean>`coalesce(${sql.raw(exactlyThisWorkspace(table))}, false)`;

// Scope is the workspace, never a request field — the columns fill themselves from the session
export const workspaceScopeColumns = {
  legalEntityId: uuid('legal_entity_id').default(sql.raw(LE_GUC)),
  siteId: uuid('site_id').default(sql.raw(SITE_GUC)),
};

// Reads reach upward so a workspace sees what it inherits; writes land only on the workspace you are in.
//
// Split per operation rather than one FOR ALL policy, because Postgres applies WITH CHECK to INSERT and
// UPDATE but never to DELETE. A single policy whose USING is ancestor-or-self therefore lets a site
// delete the row it merely inherits from its organization — every sibling below it stops selling. The
// modifying operations put the narrow predicate in USING, which is what actually restricts them.
export const workspaceScopePolicies = (name: string) => {
  const reach = sql.raw(`coalesce(${ancestorOrSelf()}, false)`);
  const owned = sql.raw(`coalesce(${exactlyThisWorkspace()}, false)`);

  return [
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy(name, { as: 'restrictive', for: 'select', using: reach }),
    pgPolicy(`${name}_insert`, { as: 'restrictive', for: 'insert', withCheck: owned }),
    pgPolicy(`${name}_update`, { as: 'restrictive', for: 'update', using: owned, withCheck: owned }),
    pgPolicy(`${name}_delete`, { as: 'restrictive', for: 'delete', using: owned }),
  ];
};
