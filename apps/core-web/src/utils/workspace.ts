import { parseSlug } from '@vritti/quantum-ui/slug';

export type WorkspaceKind = 'site' | 'group' | 'le' | 'org';

export interface ActiveWorkspace {
  kind: WorkspaceKind;
  id: string | null;
}

// The URL word for each workspace kind: /site/<id>, /sg/<id>, /le/<id>, /org/<id>. The same words mark an entity
// inside feature URLs (…/suppliers/<slug>/site/<id>), which is what lets a route tell a site from an item.
export const WORKSPACE_SEGMENTS: ReadonlyArray<{ segment: string; kind: WorkspaceKind }> = [
  { segment: 'site', kind: 'site' },
  { segment: 'sg', kind: 'group' },
  { segment: 'le', kind: 'le' },
  { segment: 'org', kind: 'org' },
];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function workspaceKindOf(segment: string): WorkspaceKind | null {
  return WORKSPACE_SEGMENTS.find((entry) => entry.segment === segment)?.kind ?? null;
}

// Extracts the active workspace from a URL path like /site/<uuid>/products or /org/<uuid>/settings
export function extractWorkspaceFromPath(pathname: string): ActiveWorkspace | null {
  const [segment, id] = pathname.split('/').filter(Boolean);
  const kind = segment ? workspaceKindOf(segment) : null;
  return kind && id && isUuid(id) ? { kind, id } : null;
}

// Returns the workspace of the current URL
export function getActiveWorkspace(): ActiveWorkspace | null {
  return extractWorkspaceFromPath(window.location.pathname);
}

// Builds the root path of a workspace: /site/<id>, /sg/<id>, /le/<id>, or /org/<id>
export function workspacePath(kind: WorkspaceKind, id: string): string {
  const entry = WORKSPACE_SEGMENTS.find((p) => p.kind === kind);
  return `/${entry?.segment ?? 'site'}/${id}`;
}

// Returns the root path of the workspace in a URL, or null when the URL is not inside one
export function extractWorkspaceBase(pathname: string): string | null {
  const workspace = extractWorkspaceFromPath(pathname);
  return workspace?.id ? workspacePath(workspace.kind, workspace.id) : null;
}

const LEGACY_PREFIXES: ReadonlyArray<{ prefix: string; kind: WorkspaceKind }> = [
  { prefix: 'site-', kind: 'site' },
  { prefix: 'sg-', kind: 'group' },
  { prefix: 'le-', kind: 'le' },
  { prefix: 'org-', kind: 'org' },
];

// Rewrites a pre-change URL (/site-name~uuid/…) to its /site/<uuid>/… form, or null when it is not one
export function migrateLegacyWorkspacePath(pathname: string): string | null {
  const [segment, ...rest] = pathname.split('/').filter(Boolean);
  if (!segment) return null;
  for (const { prefix, kind } of LEGACY_PREFIXES) {
    if (!segment.startsWith(prefix)) continue;
    const parsed = parseSlug(segment.slice(prefix.length));
    if (!parsed?.id || !isUuid(parsed.id)) return null;
    return [workspacePath(kind, parsed.id), ...rest].join('/');
  }
  return null;
}
