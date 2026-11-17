import { getColumnTable, getTableName, sql } from '@vritti/api-sdk/drizzle-orm';
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

// Any of the tests passes
const anyOf = (...tests: string[]) => tests.map((test) => `(${test})`).join(' or ');

// A test that denies rather than passes an unset comparison through as NULL
const orFalse = (test: string) => `coalesce(${test}, false)`;

// The rows a site sees of its legal entity: the LE's own, or — shared through a link — any row of the LE the link
// passes for, the LE's or another site's
const legalEntityRowsForSiteSql = (table?: string, sharedWithSite?: string) => {
  const { le, site } = columnNames(table);
  return sharedWithSite ? `(${le} = ${LE_GUC} and ${sharedWithSite})` : `(${site} is null and ${le} = ${LE_GUC})`;
};

// A site reads the rows the column names it on, whatever their owner columns say
const namedSiteSql = (column: string) => `(${SITE_GUC} is not null and ${column} = ${SITE_GUC})`;

// The test applies to the rows that stand for the whole legal entity (no site)
const legalEntityRowSql = (test: string, table?: string) => `${columnNames(table).site} is null and (${test})`;

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
// workspace sees the whole organization, an LE workspace also sees its sites' rows. With `sharedWithSite`, a site sees
// its LE's rows — the LE's own and its other sites' — only when the test passes for them, e.g. the ones posted to it.
const anywhereInWorkspaceTreeSql = (table?: string, sharedWithSite?: string) => {
  const { le, site } = columnNames(table);
  return `
  case
    -- a site: org-owned rows, its own LE's rows, its own rows
    when ${SITE_GUC} is not null then (${le} is null and ${site} is null)
      or ${legalEntityRowsForSiteSql(table, sharedWithSite)}
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

// A row of one of the LE's sites, narrowed to the sites on the user's LE role assignment once app.le_site_ids is sent
// (every site of the LE until then)
const legalEntitySiteRowSql = (table?: string) => {
  const { le, site } = columnNames(table);
  return `${le} = ${LE_GUC} and ${site} is not null
      and (${LE_SITE_IDS} is null or ${site} = any(${LE_SITE_IDS}))`;
};

// Site-document writes: a site writes its own rows; an LE writes rows of its sites; a site group and the org never write.
const siteDocumentWriteSql = (table?: string) => {
  const { le, site } = columnNames(table);
  return `
  case
    when ${SITE_GUC} is not null then ${site} = ${SITE_GUC} and ${le} = ${LE_GUC}
    when ${SITE_GROUP_GUC} is not null then false
    when ${LE_GUC} is not null then ${legalEntitySiteRowSql(table)}
    else false
  end`;
};

// Site-document writes kept to the legal entity: an LE writes rows of its sites as siteDocumentWriteSql; the site the
// row belongs to, a site group and the org only read
const legalEntityWritesSiteRowsSql = (table?: string) => `
  case
    when ${SITE_GUC} is not null then false
    when ${SITE_GROUP_GUC} is not null then false
    when ${LE_GUC} is not null then ${legalEntitySiteRowSql(table)}
    else false
  end`;

// Writes where the LE also writes its sites' rows: each workspace writes exactly its own rows, and an LE also those of
// its sites (narrowed like siteDocumentWriteSql)
const legalEntityWritesSitesSql = (table?: string) =>
  anyOf(exactlyThisWorkspaceSql(table), siteDocumentWriteSql(table));

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

// Site documents whose rows may also stand for the whole legal entity: a site's rows as siteDocument*, the LE's rows as
// legalEntity*
const siteDocumentWithLegalEntityRowsReadSql = (table?: string) =>
  anyOf(siteDocumentReadSql(table), legalEntityRowSql(legalEntityReadSql(table), table));
const siteDocumentWithLegalEntityRowsWriteSql = (table?: string) =>
  anyOf(siteDocumentWriteSql(table), legalEntityRowSql(legalEntityWriteSql(table), table));

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

// A policy test as a selectable boolean — the table qualifies the owner columns, which a query with a second scoped
// table in its FROM needs and a policy body never does
const selectableTest = (table: PgTable, test: (table?: string) => string) =>
  sql<boolean>`${sql.raw(orFalse(test(qualifiedName(table))))}`;

// The write test of workspaceScopePolicies / workspaceHierarchyPolicies
export const ownedByWorkspaceExpression = (table: PgTable) => selectableTest(table, exactlyThisWorkspaceSql);

// The write test of workspaceHierarchyPolicies({ legalEntityWritesSites })
export const writableWithLegalEntitySitesExpression = (table: PgTable) =>
  selectableTest(table, legalEntityWritesSitesSql);

// The write test of siteDocumentPolicies({ legalEntityRows: true })
export const siteDocumentWithLegalEntityRowsWritableExpression = (table: PgTable) =>
  selectableTest(table, siteDocumentWithLegalEntityRowsWriteSql);

export const WorkspaceScopeValues = {
  ORG: 'ORG',
  LE: 'LE',
  SITE: 'SITE',
} as const;
export type WorkspaceScope = (typeof WorkspaceScopeValues)[keyof typeof WorkspaceScopeValues];

// Names the workspace a row belongs to, narrowest column first
export const workspaceScopeOf = (row: { legalEntityId: string | null; siteId: string | null }): WorkspaceScope =>
  row.siteId ? WorkspaceScopeValues.SITE : row.legalEntityId ? WorkspaceScopeValues.LE : WorkspaceScopeValues.ORG;

// The tenant column every commerce table carries, defaulted from the request's organization
export const organizationIdColumn = () =>
  uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)"));

// The legal entity a row belongs to, defaulted from the request's legal entity
export const legalEntityIdColumn = () => uuid('legal_entity_id').default(sql.raw(LE_GUC));

// The site a row belongs to, defaulted from the request's site
export const siteIdColumn = () => uuid('site_id').default(sql.raw(SITE_GUC));

// The request's site as a SQL value, for a filter or insert the caller named no site for
export const currentSiteId = () => sql.raw(SITE_GUC);

// The owner columns of a row the org, a legal entity or a site may own, defaulted from the request's workspace so a
// plain insert stamps itself
export const workspaceScopeColumns = () => ({
  legalEntityId: legalEntityIdColumn(),
  siteId: siteIdColumn(),
});

// The owner columns of a site document (siteDocumentPolicies): both always set
export const siteDocumentColumns = () => ({
  legalEntityId: legalEntityIdColumn().notNull(),
  siteId: siteIdColumn().notNull(),
});

// A site column as a unique-index key where an empty site stands for the legal entity: every empty site is the same
// stratum, which a plain NULL key would treat as distinct
export const siteStratum = (siteId: AnyPgColumn) =>
  sql`coalesce(${siteId}, '00000000-0000-0000-0000-000000000000'::uuid)`;

// PERMISSIVE, FOR ALL.
export const orgIsolationPolicy = () =>
  pgPolicy('org_isolation', {
    for: 'all',
    using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
  });

// For a table that OWNS its workspace columns and whose rows should only ever be read upward.
export const workspaceScopePolicies = (name: string) => {
  const reach = sql.raw(orFalse(ancestorOrSelfSql()));
  const owned = sql.raw(orFalse(exactlyThisWorkspaceSql()));

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

// The owner's write test a child of it inherits, named after the policies the owner uses
const OWNER_WRITE_TESTS = {
  siteDocument: siteDocumentWriteSql,
  legalEntityWritesSites: legalEntityWritesSitesSql,
} as const;

type SiteInsertLink<TLink extends PgTable> = {
  table: TLink;
  fk: (table: TLink) => AnyPgColumn;
  active: (table: TLink) => AnyPgColumn;
  unlessFlagged?: SiteFlag[];
};

type SiteFlag = { flag: AnyPgColumn; item?: { column: AnyPgColumn; childColumn: AnyPgColumn } };

// A site inserting a child whose owner an active link row at that site points at, unless a site flag takes that away
const linkedAtThisSiteSql = <TLink extends PgTable>(childFk: AnyPgColumn, link: SiteInsertLink<TLink>) => {
  const { site } = columnNames('l');
  const linked = `${SITE_GUC} is not null and exists (select 1 from ${qualifiedName(link.table)} l
    where l.${link.fk(link.table).name} = ${childColumnSql(childFk)} and ${site} = ${SITE_GUC} and l.${link.active(link.table).name})`;
  return orFalse([linked, ...(link.unlessFlagged ?? []).map(notFlaggedAtThisSiteSql)].join(' and '));
};

// A child column as a policy body names it, qualified by its table since a subquery may carry a column of the same name
const childColumnSql = (column: AnyPgColumn) => `${getTableName(getColumnTable(column))}.${column.name}`;

// No row of the flag's site table at this site has the flag on — for the child's item when the flag is per item
const notFlaggedAtThisSiteSql = ({ flag, item }: SiteFlag) => {
  const { site } = columnNames('f');
  const forItem = item ? ` and f.${item.column.name} = ${childColumnSql(item.childColumn)}` : '';
  return `not exists (select 1 from ${qualifiedName(getColumnTable(flag) as PgTable)} f
    where ${site} = ${SITE_GUC} and f.${flag.name}${forItem})`;
};

export const scopeFromOwnerPolicies = <
  const TTables extends readonly PgTable[],
  TLink extends PgTable = PgTable,
>(options: {
  owner: PgTable;
  fk: AnyPgColumn;
  through?: ScopeHops<TTables>;
  ownerIs?: keyof typeof OWNER_WRITE_TESTS;
  siteInsertsThrough?: SiteInsertLink<TLink>;
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
  const ownership = options.ownerIs
    ? orFalse(OWNER_WRITE_TESTS[options.ownerIs]('o'))
    : ownedSqlFor(options.owner, 'o');
  const ownedTest = `exists (select 1 from ${from}${joins} where ${match} and ${ownership})`;
  const owned = sql.raw(ownedTest);
  const insertable = options.siteInsertsThrough
    ? sql.raw(anyOf(ownedTest, linkedAtThisSiteSql(options.fk, options.siteInsertsThrough)))
    : owned;

  return [
    orgIsolationPolicy(),
    // SELECT — the direct parent row exists and is itself readable.
    pgPolicy('reach_read', { as: 'restrictive', for: 'select', using: reachable }),
    // INSERT — WITH CHECK only: the parent chain must lead to an owner this workspace owns, or with
    // `siteInsertsThrough`, a site inserts for an owner an active link row at that site points at.
    pgPolicy('owner_insert', { as: 'restrictive', for: 'insert', withCheck: insertable }),
    // UPDATE — USING only.
    pgPolicy('owner_update', { as: 'restrictive', for: 'update', using: owned }),
    // DELETE — the policy that actually mattered.
    pgPolicy('owner_delete', { as: 'restrictive', for: 'delete', using: owned }),
  ];
};

type SharedLink<TLink extends PgTable> = { table: TLink; fk: (table: TLink) => AnyPgColumn; id: AnyPgColumn };

// For a table that OWNS its workspace columns and whose rows a parent workspace must also see — the same write rules as
// workspaceScopePolicies, but reach runs in both directions. With `sharedThrough`, a site sees its LE's rows — the LE's
// own and its other sites' — only when a row of one of the link tables points at them; each link table's own policies
// must narrow it to the site's rows and must not read this table back, or Postgres reports infinite recursion. With
// `legalEntityWritesSites`, the LE also writes its sites' rows, which each site still writes alone among sites.
export const workspaceHierarchyPolicies = <TLinks extends PgTable[]>(options?: {
  sharedThrough?: { [K in keyof TLinks]: SharedLink<TLinks[K]> };
  legalEntityWritesSites?: boolean;
}) => {
  const owned = sql.raw(
    options?.legalEntityWritesSites ? orFalse(legalEntityWritesSitesSql()) : exactlyThisWorkspaceSql(),
  );
  const links = options?.sharedThrough;
  const shared = links
    ? `(${links
        .map((link) => `${link.id.name} in (select l.${link.fk(link.table).name} from ${qualifiedName(link.table)} l)`)
        .join(' or ')})`
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
  const write = sql.raw(orFalse(legalEntityWriteSql()));

  return [
    orgIsolationPolicy(),
    pgPolicy('reach_read', {
      as: 'restrictive',
      for: 'select',
      using: sql.raw(orFalse(legalEntityReadSql())),
    }),
    pgPolicy('owner_insert', { as: 'restrictive', for: 'insert', withCheck: write }),
    pgPolicy('owner_update', { as: 'restrictive', for: 'update', using: write, withCheck: write }),
    pgPolicy('owner_delete', { as: 'restrictive', for: 'delete', using: write }),
  ];
};

// The write test siteDocumentPolicies picks from its options
const siteDocumentWriteTest = (options?: { legalEntityRows?: boolean; legalEntityWritesOnly?: boolean }) => {
  if (options?.legalEntityWritesOnly) return legalEntityWritesSiteRowsSql;
  return options?.legalEntityRows ? siteDocumentWithLegalEntityRowsWriteSql : siteDocumentWriteSql;
};

// For a site-owned document table (both owner columns always set): sites write their own rows, an LE writes for its
// sites, a site group and the org only read.
// With `legalEntityRows`, a row may also leave site_id empty to stand for the whole legal entity: the LE writes it, and
// every workspace that reads the LE's rows reads it too, so each of its sites sees it beside its own. With
// `readByOwnerSite`, a site also reads — but does not write — the rows whose column names it. With
// `legalEntityWritesOnly`, only the LE writes its sites' rows and each site only reads its own.
export const siteDocumentPolicies = (options?: {
  legalEntityRows?: boolean;
  readByOwnerSite?: AnyPgColumn;
  legalEntityWritesOnly?: boolean;
}) => {
  const read = orFalse(options?.legalEntityRows ? siteDocumentWithLegalEntityRowsReadSql() : siteDocumentReadSql());
  const write = sql.raw(orFalse(siteDocumentWriteTest(options)()));

  return [
    orgIsolationPolicy(),
    pgPolicy('reach_read', {
      as: 'restrictive',
      for: 'select',
      using: sql.raw(options?.readByOwnerSite ? `${read} or ${namedSiteSql(options.readByOwnerSite.name)}` : read),
    }),
    pgPolicy('owner_insert', { as: 'restrictive', for: 'insert', withCheck: write }),
    pgPolicy('owner_update', { as: 'restrictive', for: 'update', using: write, withCheck: write }),
    pgPolicy('owner_delete', { as: 'restrictive', for: 'delete', using: write }),
  ];
};
