import { sql } from '@vritti/api-sdk/drizzle-orm';
import { type AnyPgColumn, getTableConfig, type PgTable, pgPolicy, uuid } from '@vritti/api-sdk/drizzle-pg-core';

// Every commerce table is guarded by the same five policies, built by the three factories at the
// bottom of this file. Postgres decides a row with
//
//     allowed = (OR of every PERMISSIVE policy) AND (AND of every RESTRICTIVE policy)
//
// so org_isolation is PERMISSIVE and is the only thing that lets anything through; the four scope
// policies are RESTRICTIVE and only ever narrow it. A table with restrictive policies and no
// permissive one is sealed shut for everyone.
//
//   org_isolation   PERMISSIVE  ALL      the tenant gate — rows of this organization
//   reach_read      RESTRICTIVE SELECT   which of those rows this workspace may SEE
//   owner_insert    RESTRICTIVE INSERT   a new row must land in exactly this workspace
//   owner_update    RESTRICTIVE UPDATE   only rows this workspace OWNS, and it cannot move them out
//   owner_delete    RESTRICTIVE DELETE   only rows this workspace OWNS
//
// Reading is wider than writing on purpose: a site inherits its LE's and its org's rows and must be
// able to read them, but must never edit or delete them.

// The request's workspace, set transaction-locally by applyRlsContext. nullif() treats an unset GUC
// and an empty-string GUC the same, so a blank context reads as NULL rather than failing the cast.
// Exactly one of SITE / SITE_GROUP / LE is populated per request — core-server's contextResolver
// blanks the others — so the branches below can be read in any order without overlapping.
export const ORG_GUC = "cast(nullif(current_setting('app.org_id', true), '') as uuid)";
export const LE_GUC = "cast(nullif(current_setting('app.le_id', true), '') as uuid)";
export const SITE_GUC = "cast(nullif(current_setting('app.site_id', true), '') as uuid)";
export const SITE_GROUP_GUC = "cast(nullif(current_setting('app.site_group_id', true), '') as uuid)";

// The sites belonging to the site-group workspace, sent as a comma-joined list because this database
// has no sites or site_groups table to resolve membership from. Until the gateway populates it the
// expression is NULL, so `= any(...)` yields NULL and the group simply sees nothing extra.
const GROUP_SITE_IDS = "string_to_array(nullif(current_setting('app.site_ids', true), ''), ',')::uuid[]";

// A row's owner is the (legal_entity_id, site_id) pair on it: both null = org-owned, LE set and site
// null = LE-owned, both set = site-owned. `table` qualifies the columns when the predicate runs
// inside a join and a bare column name would be ambiguous.
const columnNames = (table?: string) => ({
  le: table ? `${table}.legal_entity_id` : 'legal_entity_id',
  site: table ? `${table}.site_id` : 'site_id',
});

// Reach, upward only: this workspace and every workspace above it. A site sees org-owned rows, its
// own LE's rows and its own rows — never a sibling site's, and never the rows of sites beneath it.
// A site group is a reporting lens, so it reads org-owned rows plus the rows its member sites own.
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

// Reach, both directions: everything ancestorOrSelf allows, plus the rows owned BELOW this
// workspace — the org workspace sees the whole organization, an LE workspace also sees its sites'
// rows. Sibling sites still never see each other. Used where a parent must report on its children.
const anywhereInWorkspaceTreeSql = (table?: string) => {
  const { le, site } = columnNames(table);
  return `
  case
    -- a site: org-owned rows, its own LE's rows, its own rows
    when ${SITE_GUC} is not null then (${le} is null and ${site} is null)
      or (${site} is null and ${le} = ${LE_GUC})
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

// Ownership: the row's owner columns match this workspace exactly. This is the write test — seeing
// a row is never enough to change it. Can evaluate to NULL, which a policy already treats as false.
// A site group owns nothing: it is a read-only reporting lens, and no column records group
// ownership, so every write from a group workspace is refused.
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

// Renders a drizzle table as the schema-qualified text a policy body needs
const qualifiedName = (table: PgTable) => {
  const { schema, name } = getTableConfig(table);
  return schema ? `${schema}.${name}` : name;
};

// One link in the chain from a scopeless table up to its owner. `fk` is a callback so TypeScript
// checks the column against the table named beside it, rather than trusting two loose strings.
type ScopeHops<TTables extends readonly PgTable[]> = {
  [Index in keyof TTables]: { table: TTables[Index]; fk: (table: TTables[Index]) => AnyPgColumn };
};

const resolveHop = <TTable extends PgTable>(hop: { table: TTable; fk: (table: TTable) => AnyPgColumn }) => ({
  table: qualifiedName(hop.table),
  column: hop.fk(hop.table).name,
});

// The ownership test as a selectable boolean, for the isOwned flag services branch on. Unlike the
// policy bodies this MUST coalesce — a SELECT list returning NULL would reach the DTO as null.
export const ownedByWorkspaceExpression = (table?: string) =>
  sql<boolean>`coalesce(${sql.raw(exactlyThisWorkspaceSql(table))}, false)`;

// The owner columns, defaulted from the request's workspace so a plain insert stamps itself
export const workspaceScopeColumns = {
  legalEntityId: uuid('legal_entity_id').default(sql.raw(LE_GUC)),
  siteId: uuid('site_id').default(sql.raw(SITE_GUC)),
};

// The tenant column every commerce table carries, defaulted from the request's organization
export const organizationIdColumn = uuid('organization_id')
  .notNull()
  .default(sql.raw("cast(current_setting('app.org_id') as uuid)"));

// PERMISSIVE, FOR ALL. The tenant gate, and the OR-base every restrictive policy below narrows.
// Each factory already includes it — a schema file must never add it a second time.
export const orgIsolationPolicy = () =>
  pgPolicy('org_isolation', {
    for: 'all',
    using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
  });

// For a table that OWNS its workspace columns and whose rows should only ever be read upward.
// `name` prefixes the policy names because these predate the shared naming.
export const workspaceScopePolicies = (name: string) => {
  const reach = sql.raw(`coalesce(${ancestorOrSelfSql()}, false)`);
  const owned = sql.raw(`coalesce(${exactlyThisWorkspaceSql()}, false)`);

  return [
    orgIsolationPolicy(),
    // SELECT — rows owned by this workspace or any workspace above it. Also gates the read half of
    // any UPDATE or DELETE with a WHERE, since such a row has to be found before it can be touched.
    pgPolicy(name, { as: 'restrictive', for: 'select', using: reach }),
    // INSERT — there is no existing row, so only WITH CHECK is consulted: the row being written must
    // land in exactly this workspace. A site cannot create an org-owned row.
    pgPolicy(`${name}_insert`, { as: 'restrictive', for: 'insert', withCheck: owned }),
    // UPDATE — USING selects which existing rows may be updated; WITH CHECK re-tests the row after
    // the change, so a row cannot be edited out of this workspace. Stated explicitly here, though
    // Postgres would reuse USING for WITH CHECK if it were omitted.
    pgPolicy(`${name}_update`, { as: 'restrictive', for: 'update', using: owned, withCheck: owned }),
    // DELETE — WITH CHECK is never consulted for a delete (there is no resulting row), so the
    // ownership test has to live in USING or the table would be deletable by anyone who can see it.
    pgPolicy(`${name}_delete`, { as: 'restrictive', for: 'delete', using: owned }),
  ];
};

// For a table that carries NO workspace columns of its own. Its scope is derived per query by
// walking up to the owner — the nearest ancestor that does carry them.
//
// Reach cascades on its own: proving the parent row exists is enough, because the parent's own
// reach_read already hid the parents this workspace cannot see. That holds at any depth, which is
// why reach_read below never names more than the direct parent.
//
// Ownership does NOT cascade. The same subquery only ever proves reach, so each write policy must
// join all the way to the owner and test ownership there. Skipping that is the bug this file was
// rewritten to fix: a site could see an org-owned offering and therefore delete its variants.
//
// `through` lists the upward link of every table between this one and the owner, nearest first —
// empty for a direct child, one entry for a grandchild, and so on.
export const scopeFromOwnerPolicies = <const TTables extends readonly PgTable[]>(options: {
  owner: PgTable;
  fk: AnyPgColumn;
  through?: ScopeHops<TTables>;
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
  const owned = sql.raw(`exists (select 1 from ${from}${joins} where ${match} and ${exactlyThisWorkspaceSql('o')})`);

  return [
    orgIsolationPolicy(),
    // SELECT — the direct parent row exists and is itself readable. No join to the owner is needed
    // because the parent's policy already applied.
    pgPolicy('reach_read', { as: 'restrictive', for: 'select', using: reachable }),
    // INSERT — WITH CHECK only: the parent chain must lead to an owner this workspace owns.
    pgPolicy('owner_insert', { as: 'restrictive', for: 'insert', withCheck: owned }),
    // UPDATE — USING only. A row here has no workspace columns to change, so there is nothing for a
    // WITH CHECK to re-test; Postgres reuses USING for it anyway.
    pgPolicy('owner_update', { as: 'restrictive', for: 'update', using: owned }),
    // DELETE — the policy that actually mattered. Without the join to the owner this read as mere
    // reach, and any workspace that could see the parent could delete this row.
    pgPolicy('owner_delete', { as: 'restrictive', for: 'delete', using: owned }),
  ];
};

// For a table that OWNS its workspace columns and whose rows a parent workspace must also see —
// the same write rules as workspaceScopePolicies, but reach runs in both directions.
export const workspaceHierarchyPolicies = () => {
  const owned = sql.raw(exactlyThisWorkspaceSql());

  return [
    orgIsolationPolicy(),
    // SELECT — upward AND downward through the workspace tree; siblings stay invisible.
    pgPolicy('reach_read', { as: 'restrictive', for: 'select', using: sql.raw(anywhereInWorkspaceTreeSql()) }),
    // INSERT — WITH CHECK only: the new row must be stamped with exactly this workspace.
    pgPolicy('owner_insert', { as: 'restrictive', for: 'insert', withCheck: owned }),
    // UPDATE — USING picks the owned rows; Postgres reuses it as WITH CHECK, so an update cannot
    // move a row to another workspace.
    pgPolicy('owner_update', { as: 'restrictive', for: 'update', using: owned }),
    // DELETE — ownership in USING, since WITH CHECK is never consulted for a delete. Wide reach
    // makes this the policy that matters most here: an org workspace can SEE every row but may only
    // delete the ones it owns.
    pgPolicy('owner_delete', { as: 'restrictive', for: 'delete', using: owned }),
  ];
};
