import { createPreferences } from '@vritti/quantum-ui-native/utils';
import type { ActiveWorkspace, WorkspaceKind } from '../types/permissions';

export const { instance: preferences, storage: preferencesStorage } = createPreferences('vritti.preferences');

export const { instance: apolloCacheStore } = createPreferences('vritti.apollo-cache');

export const { instance: offlineQueueStore } = createPreferences('vritti.offline-queue');

const SELECTED_WORKSPACE_KEY = 'selectedWorkspace';

// Exactly one context header goes out per request, chosen by the active workspace kind.
const WORKSPACE_HEADER_BY_KIND: Record<WorkspaceKind, string> = {
  site: 'x-site-id',
  group: 'x-sg-id',
  le: 'x-le-id',
  org: 'x-org-id',
};

export function getSelectedWorkspace(): ActiveWorkspace | null {
  const raw = preferences.getString(SELECTED_WORKSPACE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ActiveWorkspace;
    return parsed && parsed.kind ? parsed : null;
  } catch {
    return null;
  }
}

export function setSelectedWorkspace(workspace: ActiveWorkspace): void {
  preferences.set(SELECTED_WORKSPACE_KEY, JSON.stringify(workspace));
}

// Back-compat: the selected site id is only defined when the active workspace is a site.
export function getSelectedSiteId(): string | null {
  const workspace = getSelectedWorkspace();
  return workspace?.kind === 'site' ? workspace.id : null;
}

export function setSelectedSiteId(siteId: string): void {
  setSelectedWorkspace({ kind: 'site', id: siteId });
}

// The single tenant-context header the request layer sends for the active workspace.
export function getActiveWorkspaceHeader(): Record<string, string> {
  const workspace = getSelectedWorkspace();
  if (!workspace?.id) return {};
  return { [WORKSPACE_HEADER_BY_KIND[workspace.kind]]: workspace.id };
}
