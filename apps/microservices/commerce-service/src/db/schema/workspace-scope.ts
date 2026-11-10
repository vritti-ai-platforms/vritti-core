import { sql } from '@vritti/api-sdk/drizzle-orm';
import { type AnyPgColumn, getTableConfig, type PgTable, pgPolicy, uuid } from '@vritti/api-sdk/drizzle-pg-core';

// Every commerce table is guarded by the same five policies, built by the three factories at the bottom of this file.

export const ORG_GUC = "cast(nullif(current_setting('app.org_id', true), '') as uuid)";
export const LE_GUC = "cast(nullif(current_setting('app.le_id', true), '') as uuid)";
export const SITE_GUC = "cast(nullif(current_setting('app.site_id', true), '') as uuid)";
export const SITE_GROUP_GUC = "cast(nullif(current_setting('app.site_group_id', true), '') as uuid)";

const GROUP_SITE_IDS = "string_to_array(nullif(current_setting('app.site_ids', true), ''), ',')::uuid[]";
const LE_SITE_IDS = "string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]";

// A row's owner is the (legal_entity_id, site_id) pair on it: both null = org-owned, LE set and site null = LE-owned,
// both set = site-owned.
const columnNames = (table?: string) => ({
  le: table ? `${table}.legal_entity_id` : 'legal_entity_id',
  site: table ? `${table}.site_id` : 'site_id',
});

// Reach, upward only: this workspace and every workspace above it.
const ancestorOrSelfSql = (table?: string) => {
  const { le, site } = columnNames(table);
  return `
  case
    when ${SITE_GUC} is not null then (${le} is null and ${site} is null)
      or (${le} = ${LE_GUC} and ${site} is null)
      or (${le} = ${LE_GUC} and ${site} = ${SITE_GUC})
    when ${SITE_GROUP_GUC} is not null then (${le} is null and ${site} is null)
      or (${site} = any(${GROUP_SITE_IDS}))
    when ${LE_GUC} is not null then (${le} is null and ${site} is null)
      or (${le} = ${LE_GUC} and ${site} is null)
    when ${ORG_GUC} is not null then ${le} is null and ${site} is null
    else false
  end`;
};

// Reach, both directions: everything ancestorOrSelf allows, plus the rows owned BELOW this workspace — the org
// workspace sees the whole organization, an LE workspace also sees its sites' rows. `sharedWithSite` narrows the LE's
// rows a site sees to those the test passes for, e.g. the ones posted to it.
const anywhereInWorkspaceTreeSql = (table?: string, sharedWithSite?: string) => {
  const { le, site } = columnNames(table);
  return `
  case
    -- a site: org-owned rows, its own LE's rows, its own rows
    when ${SITE_GUC} is not null then (${le} is null and ${site} is null)
      or (${site} is null and ${le} = ${LE_GUC}${sharedWithSite ? ` and ${sharedWithSite}` : ''})
      or (${site} = ${SITE_GUC})
    -- a site group: org-owned rows plus whatever its member sites own, and nothing else
    when ${SITE_GROUP_GUC} is not null then (${le} is null and ${site} is null)
      or (${site} = any(${GROUP_SITE_IDS}))
    -- an LE: org-owned rows, its own rows, and everything its sites own
    when ${LE_GUC} is not null then (${le} is null and ${site} is null)
      or (${le} = ${LE_GUC})
    -- the org workspace: every row in the organization
    when ${ORG_GUC} is not null then true
    else false
  end`;
};

// Ownership: the row's owner columns match this workspace exactly.
const exactlyThisWorkspaceSql = (table?: string) => {
  const { le, site } = columnNames(table);
  return `
  case
    when ${SITE_GUC} is not null then ${site} = ${SITE_GUC} and ${le} = ${LE_GUC}
    when ${SITE_GROUP_GUC} is not null then false
    when ${LE_GUC} is not null then ${le} = ${LE_GUC} and ${site} is null
    when ${ORG_GUC} is not null then ${le} is null and ${site} is null
    else false
  end`;
};

// Site-document reach: a site its own rows, a site group its member sites' rows, an LE every row of its sites, the org
// everything. Site documents are never org- or LE-owned, so there is no upward reach.
const siteDocumentReadSql = (table?: string) => {
  const { le, site } = columnNames(table);
  return `
  case
    when ${SITE_GUC} is not null then ${site} = ${SITE_GUC}
    when ${SITE_GROUP_GUC} is not null then ${site} = any(${GROUP_SITE_IDS})
    when ${LE_GUC} is not null then ${le} = ${LE_GUC}
    when ${ORG_GUC} is not null then true
    else false
  end`;
};

// Site-document writes: a site writes its own rows; an LE writes rows of its sites, narrowed to the sites on the user's
// LE role assignment once app.le_site_ids is sent (every site of the LE until then); a site group and the org never
// write.
const siteDocumentWriteSql = (table?: string) => {
  const { le, site } = columnNames(table);
  return `
  case
    when ${SITE_GUC} is not null then ${site} = ${SITE_GUC} and ${le} = ${LE_GUC}
    when ${SITE_GROUP_GUC} is not null then false
    when ${LE_GUC} is not null then ${le} = ${LE_GUC} and ${site} is not null
      and (${LE_SITE_IDS} is null or ${site} = any(${LE_SITE_IDS}))
    else false
  end`;
};

// LE-owned reach, for a table with legal_entity_id and no site_id: an LE and its sites read the LE's rows; a site group
// and the org read every LE's rows, since the request does not carry which LEs a group spans.
const legalEntityReadSql = (table?: string) => {
  const { le } = columnNames(table);
  return `
  case
    when ${SITE_GUC} is not null then ${le} = ${LE_GUC}
    when ${SITE_GROUP_GUC} is not null then true
    when ${LE_GUC} is not null then ${le} = ${LE_GUC}
    when ${ORG_GUC} is not null then true
    else false
  end`;
};

// LE-owned writes: only the owning LE's own workspace; its sites, a site group and the org only read.
const legalEntityWriteSql = (table?: string) => {
  const { le } = columnNames(table);
  return `
  case
    when ${SITE_GUC} is not null then false
    when ${SITE_GROUP_GUC} is not null then false
    when ${LE_GUC} is not null then ${le} = ${LE_GUC}
    else false
  end`;
};

// The ownership test for an owner table: the LE-only test when the table has no site_id, the full pair test otherwise
const ownedSqlFor = (table: PgTable, alias: string) => {
  const hasSite = getTableConfig(table).columns.some((column) => column.name === columnNames().site);
  return hasSite ? exactlyThisWorkspaceSql(alias) : legalEntityWriteSql(alias);
};

// Renders a drizzle table as the schema-qualified text a policy body needs
const qualifiedName = (table: PgTable) => {
  const { schema, name } = getTableConfig(table);
  return schema ? `${schema}.${name}` : name;
};

type ScopeHops<TTables extends readonly PgTable[]> = {
  [Index in keyof TTables]: { table: TTables[Index]; fk: (table: TTables[Index]) => AnyPgColumn };
};

const resolveHop = <TTable extends PgTable>(hop: { table: TTable; fk: (table: TTable) => AnyPgColumn }) => ({
  table: qualifiedName(hop.table),
  column: hop.fk(hop.table).name,
});

// The ownership test as a selectable boolean — the table qualifies the owner columns, which a query with a
// second scoped table in its FROM needs and a policy body never does
export const ownedByWorkspaceExpression = (table: PgTable) =>
  sql<boolean>`coalesce(${sql.raw(exactlyThisWorkspaceSql(qualifiedName(table)))}, false)`;

export const WorkspaceScopeValues = {
  ORG: 'ORG',
  LE: 'LE',
  SITE: 'SITE',
} as const;
export type WorkspaceScope = (typeof WorkspaceScopeValues)[keyof typeof WorkspaceScopeValues];

// Names the workspace a row belongs to, narrowest column first
export const workspaceScopeOf = (row: { legalEntityId: string | null; siteId: string | null }): WorkspaceScope =>
  row.siteId ? WorkspaceScopeValues.SITE : row.legalEntityId ? WorkspaceScopeValues.LE : WorkspaceScopeValues.ORG;

// The owner columns, defaulted from the request's workspace so a plain insert stamps itself
export const workspaceScopeColumns = {
  legalEntityId: uuid('legal_entity_id').default(sql.raw(LE_GUC)),
  siteId: uuid('site_id').default(sql.raw(SITE_GUC)),
};

// A site column as a unique-index key where an empty site stands for the legal entity: every empty site is the same
// stratum, which a plain NULL key would treat as distinct
export const siteStratum = (siteId: AnyPgColumn) =>
  sql`coalesce(${siteId}, '00000000-0000-0000-0000-000000000000'::uuid)`;

// The tenant column every commerce table carries, defaulted from the request's organization
export const organizationIdColumn = uuid('organization_id')
  .notNull()
  .default(sql.raw("cast(current_setting('app.org_id') as uuid)"));

// PERMISSIVE, FOR ALL.
export const orgIsolationPolicy = () =>
  pgPolicy('org_isolation', {
    for: 'all',
    using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
  });

// For a table that OWNS its workspace columns and whose rows should only ever be read upward.
export const workspaceScopePolicies = (name: string) => {
  const reach = sql.raw(`coalesce(${ancestorOrSelfSql()}, false)`);
  const owned = sql.raw(`coalesce(${exactlyThisWorkspaceSql()}, false)`);

  return [
    orgIsolationPolicy(),
    // SELECT — rows owned by this workspace or any workspace above it.
    pgPolicy(name, { as: 'restrictive', for: 'select', using: reach }),
    // INSERT — there is no existing row, so only WITH CHECK is consulted: the row being written must land in exactly
    // this workspace.
    pgPolicy(`${name}_insert`, { as: 'restrictive', for: 'insert', withCheck: owned }),
    // UPDATE — USING selects which existing rows may be updated; WITH CHECK re-tests the row after the change, so a row
    // cannot be edited out of this workspace.
    pgPolicy(`${name}_update`, { as: 'restrictive', for: 'update', using: owned, withCheck: owned }),
    // DELETE — WITH CHECK is never consulted for a delete (there is no resulting row), so the ownership test has to
    // live in USING or the table would be deletable by anyone who can see it.
    pgPolicy(`${name}_delete`, { as: 'restrictive', for: 'delete', using: owned }),
  ];
};

export const scopeFromOwnerPolicies = <const TTables extends readonly PgTable[]>(options: {
  owner: PgTable;
  fk: AnyPgColumn;
  through?: ScopeHops<TTables>;
  ownerIs?: 'siteDocument';
}) => {
  const fk = options.fk.name;
  const owner = qualifiedName(options.owner);
  const through = (options.through ?? []).map(resolveHop);
  const alias = (index: number) => (index === 0 ? 'p' : `p${index + 1}`);

  const from = through.length > 0 ? `${through[0].table} ${alias(0)}` : `${owner} o`;
  const match = through.length > 0 ? `${alias(0)}.id = ${fk}` : `o.id = ${fk}`;
  const joins = through
    .map((hop, index) => {
      const next = through[index + 1];
      const target = next ? `${next.table} ${alias(index + 1)}` : `${owner} o`;
      const targetAlias = next ? alias(index + 1) : 'o';
      return ` join ${target} on ${targetAlias}.id = ${alias(index)}.${hop.column}`;
    })
    .join('');

  const reachable = sql.raw(`exists (select 1 from ${from} where ${match})`);
  const ownership =
    options.ownerIs === 'siteDocument'
      ? `coalesce(${siteDocumentWriteSql('o')}, false)`
      : ownedSqlFor(options.owner, 'o');
  const owned = sql.raw(`exists (select 1 from ${from}${joins} where ${match} and ${ownership})`);

  return [
    orgIsolationPolicy(),
    // SELECT — the direct parent row exists and is itself readable.
    pgPolicy('reach_read', { as: 'restrictive', for: 'select', using: reachable }),
    // INSERT — WITH CHECK only: the parent chain must lead to an owner this workspace owns.
    pgPolicy('owner_insert', { as: 'restrictive', for: 'insert', withCheck: owned }),
    // UPDATE — USING only.
    pgPolicy('owner_update', { as: 'restrictive', for: 'update', using: owned }),
    // DELETE — the policy that actually mattered.
    pgPolicy('owner_delete', { as: 'restrictive', for: 'delete', using: owned }),
  ];
};

// For a table that OWNS its workspace columns and whose rows a parent workspace must also see — the same write rules as
// workspaceScopePolicies, but reach runs in both directions. With `sharedThrough`, a site sees its LE's rows only when
// a row of the link table points at them; that table's own policies must narrow it to the site's rows and must not read
// this table back, or Postgres reports infinite recursion.
export const workspaceHierarchyPolicies = <TLink extends PgTable>(options?: {
  sharedThrough: { table: TLink; fk: (table: TLink) => AnyPgColumn; id: AnyPgColumn };
}) => {
  const owned = sql.raw(exactlyThisWorkspaceSql());
  const link = options?.sharedThrough;
  const shared = link
    ? `${link.id.name} in (select l.${link.fk(link.table).name} from ${qualifiedName(link.table)} l)`
    : undefined;

  return [
    orgIsolationPolicy(),
    // SELECT — upward AND downward through the workspace tree; siblings stay invisible.
    pgPolicy('reach_read', {
      as: 'restrictive',
      for: 'select',
      using: sql.raw(anywhereInWorkspaceTreeSql(undefined, shared)),
    }),
    // INSERT — WITH CHECK only: the new row must be stamped with exactly this workspace.
    pgPolicy('owner_insert', { as: 'restrictive', for: 'insert', withCheck: owned }),
    // UPDATE — USING picks the owned rows; Postgres reuses it as WITH CHECK, so an update cannot move a row to another
    // workspace.
    pgPolicy('owner_update', { as: 'restrictive', for: 'update', using: owned }),
    // DELETE — ownership in USING, since WITH CHECK is never consulted for a delete.
    pgPolicy('owner_delete', { as: 'restrictive', for: 'delete', using: owned }),
  ];
};

// For a table owned by a legal entity (legal_entity_id set, no site_id): the LE writes, everything else only reads.
export const legalEntityOwnedPolicies = () => {
  const write = sql.raw(`coalesce(${legalEntityWriteSql()}, false)`);

  return [
    orgIsolationPolicy(),
    pgPolicy('reach_read', {
      as: 'restrictive',
      for: 'select',
      using: sql.raw(`coalesce(${legalEntityReadSql()}, false)`),
    }),
    pgPolicy('owner_insert', { as: 'restrictive', for: 'insert', withCheck: write }),
    pgPolicy('owner_update', { as: 'restrictive', for: 'update', using: write, withCheck: write }),
    pgPolicy('owner_delete', { as: 'restrictive', for: 'delete', using: write }),
  ];
};

// For a site-owned document table (both owner columns always set): sites write their own rows, an LE writes for its
// sites, a site group and the org only read.
// With `legalEntityRows`, a row may also leave site_id empty to stand for the whole legal entity: the LE writes it, and
// every workspace that reads the LE's rows reads it too, so each of its sites sees it beside its own.
export const siteDocumentPolicies = (options?: { legalEntityRows?: boolean }) => {
  const { site } = columnNames();
  const orLegalEntityRow = (siteSql: string, legalEntitySql: string) =>
    options?.legalEntityRows ? `(${siteSql}) or (${site} is null and (${legalEntitySql}))` : siteSql;
  const write = sql.raw(`coalesce(${orLegalEntityRow(siteDocumentWriteSql(), legalEntityWriteSql())}, false)`);

  return [
    orgIsolationPolicy(),
    pgPolicy('reach_read', {
      as: 'restrictive',
      for: 'select',
      using: sql.raw(`coalesce(${orLegalEntityRow(siteDocumentReadSql(), legalEntityReadSql())}, false)`),
    }),
    pgPolicy('owner_insert', { as: 'restrictive', for: 'insert', withCheck: write }),
    pgPolicy('owner_update', { as: 'restrictive', for: 'update', using: write, withCheck: write }),
    pgPolicy('owner_delete', { as: 'restrictive', for: 'delete', using: write }),
  ];
};
