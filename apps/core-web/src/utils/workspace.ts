import { buildSlug, parseSlug } from '@vritti/quantum-ui/slug';

export type WorkspaceKind = 'site' | 'group' | 'le' | 'org';

export interface ActiveWorkspace {
  kind: WorkspaceKind;
  id: string | null;
}

export const WORKSPACE_SLUG_PREFIXES: ReadonlyArray<{ prefix: string; kind: WorkspaceKind }> = [
  { prefix: 'bu-', kind: 'site' },
  { prefix: 'sg-', kind: 'group' },
  { prefix: 'le-', kind: 'le' },
  { prefix: 'org-', kind: 'org' },
];

// Extracts the active workspace from a URL path like /bu-name~uuid/products or /org-name~uuid/settings
export function extractWorkspaceFromPath(pathname: string): ActiveWorkspace | null {
  const segment = pathname.split('/').filter(Boolean)[0];
  if (!segment) return null;
  for (const { prefix, kind } of WORKSPACE_SLUG_PREFIXES) {
    if (segment.startsWith(prefix)) {
      const parsed = parseSlug(segment.slice(prefix.length));
      return parsed?.id ? { kind, id: parsed.id } : null;
    }
  }
  return null;
}

// Returns the URL slug segment for the active workspace ('bu-name~uuid', 'sg-…', 'le-…', or 'org-…')
export function extractWorkspaceSlug(pathname: string): string | null {
  const segment = pathname.split('/').filter(Boolean)[0];
  if (!segment) return null;
  return WORKSPACE_SLUG_PREFIXES.some(({ prefix }) => segment.startsWith(prefix)) ? segment : null;
}

// Builds the root path of a workspace: /bu-name~uuid, /sg-name~uuid, /le-name~uuid, or /org-name~uuid
export function workspacePath(kind: WorkspaceKind, name: string, id: string): string {
  const entry = WORKSPACE_SLUG_PREFIXES.find((p) => p.kind === kind);
  return `/${entry?.prefix ?? 'bu-'}${buildSlug(name, id)}`;
}
