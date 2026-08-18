/**
 * The scope a request acts within.
 *
 * A discriminated union, not a bag of optional ids, and that is the point: two scopes
 * at once are **unrepresentable**. Sending `x-site-id` alongside a mismatched
 * `x-le-id` would set both row-level-security variables in core, which AND together —
 * so the request would return nothing at all, with nothing explaining why. The type
 * makes that impossible to write.
 *
 * `org` carries no id: organization scope is the *absence* of a narrower one, and the
 * organization itself always comes from the app credential, never from a header.
 */
export type WorkspaceKind = 'site' | 'group' | 'le' | 'org';

export type Workspace = { kind: Exclude<WorkspaceKind, 'org'>; id: string } | { kind: 'org' };

/**
 * Which header expresses each scope.
 *
 * The same mapping `core-web` (`quantum-ui.config.ts`) and `core-app`
 * (`WORKSPACE_HEADER_BY_KIND`) already use — the kind *is* which header is sent, so
 * core needs no separate scope vocabulary to interpret it.
 */
const WORKSPACE_HEADER = {
  site: 'x-site-id',
  group: 'x-sg-id',
  le: 'x-le-id',
} as const;

/** The one header a workspace produces, or none for organization scope. */
export function workspaceHeaders(workspace?: Workspace): Record<string, string> {
  if (!workspace || workspace.kind === 'org') return {};
  return { [WORKSPACE_HEADER[workspace.kind]]: workspace.id };
}

/** What a request acts as: a person, within a scope. Both are covered by the signature. */
export type RequestContext = {
  /** The party the app is acting for — a signed-in shopper, typically. */
  partyId?: string;
  workspace?: Workspace;
};

/** One scope the organization has, as `workspaces.list()` returns it. */
export type WorkspaceOption = {
  kind: Exclude<WorkspaceKind, 'org'>;
  id: string;
  name: string;
  code: string;
  /** A site's legal entity, or a group's parent group. Null at the top of a chain. */
  parentId: string | null;
};

/**
 * Every scope available, grouped by kind.
 *
 * Three lists rather than one flat array so a caller can render them as the hierarchy
 * they are, and because picking a site is a different decision from picking a legal
 * entity.
 */
export type Workspaces = {
  legalEntities: WorkspaceOption[];
  siteGroups: WorkspaceOption[];
  sites: WorkspaceOption[];
};
