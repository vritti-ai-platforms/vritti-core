import { FormatProvider } from '@vritti/quantum-ui-native/context';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apolloClient, purgeApolloPersisted } from '../config/apollo';
import { getSelectedWorkspace, setSelectedWorkspace } from '../config/storage';
import type { AuthStatusOrg } from '../types/auth-status';
import type {
  ActiveWorkspace,
  AssignedLegalEntity,
  AssignedRole,
  AssignedSite,
  AssignedSiteGroup,
  PermissionFeature,
  PermissionGateFn,
  PermissionGateResult,
  WorkspaceKind,
} from '../types/permissions';
import { useAuthSessionSnapshot } from './AuthProvider';

interface PermissionContextValue {
  org: AuthStatusOrg | null;
  sites: AssignedSite[];
  legalEntities: AssignedLegalEntity[];
  siteGroups: AssignedSiteGroup[];
  assignments: AssignedRole[];
  workspace: ActiveWorkspace | null;
  selectWorkspace: (workspace: ActiveWorkspace) => void;
  selectedSiteId: string | null;
  selectSite: (siteId: string) => void;
  features: PermissionFeature[];
  checkPermission: PermissionGateFn;
  isLoadingSites: boolean;
  isLoadingPermissions: boolean;
}

const DENY: PermissionGateResult = Object.freeze({
  granted: false,
  locked: false,
  reason: null,
  unlockPlans: [],
  available: false,
  featureName: null,
});

// Maps a role assignment's target scope to a workspace kind.
const TARGET_KIND: Record<AssignedRole['targetType'], WorkspaceKind> = {
  SITE: 'site',
  SITE_GROUP: 'group',
  LE: 'le',
  ORG: 'org',
};

// The workspace scope is part of the permission identity (scope.feature.permission). Each workspace
// resolves exactly one scope, so a code must carry THIS workspace's scope prefix — a code prefixed
// with a different scope (le.uom.view checked in an org workspace) must NOT match. Codes with no
// scope prefix are treated as legacy/unscoped for the transition.
const KIND_SCOPE_PREFIX: Record<WorkspaceKind, string> = {
  site: 'site.',
  group: 'site-group.',
  le: 'le.',
  org: 'org.',
};

const SCOPE_PREFIXES = Object.values(KIND_SCOPE_PREFIX);

// Builds a granted result, deriving `available` (granted && !locked) so it's always consistent.
function grant(
  locked: boolean,
  reason: PermissionGateResult['reason'],
  unlockPlans: string[],
  featureName: string,
): PermissionGateResult {
  return { granted: true, locked, reason, unlockPlans, available: !locked, featureName };
}

// Denied but the feature is known — carries its name so messages can stay feature-specific.
function deny(featureName: string): PermissionGateResult {
  return { granted: false, locked: false, reason: null, unlockPlans: [], available: false, featureName };
}

// Resolves a "[scope.]feature.permission" code against the active workspace's resolved features.
function buildGate(features: PermissionFeature[], workspaceScopePrefix: string | null): PermissionGateFn {
  return (rawCode) => {
    const carriedScope = SCOPE_PREFIXES.find((p) => rawCode.startsWith(p));
    // A code carrying a scope other than this workspace's belongs to a different scope — deny it.
    if (carriedScope && carriedScope !== workspaceScopePrefix) return DENY;
    const code = carriedScope ? rawCode.slice(carriedScope.length) : rawCode;
    const dotIndex = code.indexOf('.');
    const featureCode = dotIndex === -1 ? code : code.slice(0, dotIndex);
    const permissionCode = dotIndex === -1 ? null : code.slice(dotIndex + 1);
    const feature = features.find((f) => f.code === featureCode);
    if (!feature) return DENY;
    if (!permissionCode) return grant(feature.locked, feature.lockReason, feature.unlockPlans, feature.name);
    if (!feature.permissions.includes(permissionCode)) return deny(feature.name);
    if (feature.locked) return grant(true, feature.lockReason, feature.unlockPlans, feature.name);
    const permissionLock = feature.lockedPermissions.find((p) => p.code === permissionCode);
    if (permissionLock) return grant(true, permissionLock.reason, permissionLock.unlockPlans, feature.name);
    return grant(false, null, [], feature.name);
  };
}

// Turns an assignment into the workspace it targets (ORG assignments resolve against the org id).
function assignmentWorkspace(assignment: AssignedRole, orgId: string | null): ActiveWorkspace {
  const kind = TARGET_KIND[assignment.targetType];
  return { kind, id: kind === 'org' ? orgId : assignment.targetId };
}

// A workspace is valid only while it still matches one of the user's assignments.
function isWorkspaceAssigned(workspace: ActiveWorkspace, assignments: AssignedRole[], orgId: string | null): boolean {
  return assignments.some((assignment) => {
    const target = assignmentWorkspace(assignment, orgId);
    return target.kind === workspace.kind && target.id === workspace.id;
  });
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export const usePermissionContext = (): PermissionContextValue => {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error('usePermissionContext must be used within PermissionProvider');
  return ctx;
};

interface PermissionProviderProps {
  children: React.ReactNode;
}

export const PermissionProvider = ({ children }: PermissionProviderProps) => {
  const { authState, phase, sessionOrigin } = useAuthSessionSnapshot();

  const [org, setOrg] = useState<AuthStatusOrg | null>(null);
  const [sites, setSites] = useState<AssignedSite[]>([]);
  const [legalEntities, setLegalEntities] = useState<AssignedLegalEntity[]>([]);
  const [siteGroups, setSiteGroups] = useState<AssignedSiteGroup[]>([]);
  const [assignments, setAssignments] = useState<AssignedRole[]>([]);
  const [featuresBySiteId, setFeaturesBySiteId] = useState<Record<string, PermissionFeature[]>>({});
  const [featuresByGroupId, setFeaturesByGroupId] = useState<Record<string, PermissionFeature[]>>({});
  const [featuresByLeId, setFeaturesByLeId] = useState<Record<string, PermissionFeature[]>>({});
  const [orgFeatures, setOrgFeatures] = useState<PermissionFeature[]>([]);
  const [workspace, setWorkspace] = useState<ActiveWorkspace | null>(null);

  useEffect(() => {
    if (phase !== 'authenticated' || !authState?.isAuthenticated) {
      setOrg(null);
      setSites([]);
      setLegalEntities([]);
      setSiteGroups([]);
      setAssignments([]);
      setFeaturesBySiteId({});
      setFeaturesByGroupId({});
      setFeaturesByLeId({});
      setOrgFeatures([]);
      setWorkspace(null);
      return;
    }

    setOrg(authState.org ?? null);
    setSites(authState.sites ?? []);
    setLegalEntities(authState.legalEntities ?? []);
    setSiteGroups(authState.siteGroups ?? []);
    setAssignments(authState.assignments ?? []);
    setFeaturesBySiteId(authState.featuresBySiteId ?? {});
    setFeaturesByGroupId(authState.featuresByGroupId ?? {});
    setFeaturesByLeId(authState.featuresByLeId ?? {});
    setOrgFeatures(authState.orgFeatures ?? []);
  }, [authState, phase]);

  const orgId = org?.id ?? null;

  // Resolves the active workspace from assignments: auto-continue a single SITE assignment, keep a valid
  // current/persisted choice, and on RESTORE fall back to a concrete workspace so the picker isn't flashed.
  useEffect(() => {
    if (assignments.length === 0) {
      setWorkspace(null);
      return;
    }

    if (workspace && isWorkspaceAssigned(workspace, assignments, orgId)) return;

    // Exactly one site — nothing to choose.
    if (assignments.length === 1 && assignments[0]!.targetType === 'SITE') {
      const only = assignmentWorkspace(assignments[0]!, orgId);
      setWorkspace(only);
      setSelectedWorkspace(only);
      return;
    }

    // Fresh LOGIN with a real choice: leave null so the picker shows.
    if (sessionOrigin === 'login') {
      setWorkspace(null);
      return;
    }

    // RESTORE: re-use the last-used workspace if it's still assigned, else the first assignment.
    const persisted = getSelectedWorkspace();
    const restored =
      persisted && isWorkspaceAssigned(persisted, assignments, orgId)
        ? persisted
        : assignmentWorkspace(assignments[0]!, orgId);
    setWorkspace(restored);
    setSelectedWorkspace(restored);
  }, [assignments, workspace, sessionOrigin, orgId]);

  // Features arrive in the SSE auth-state payload, keyed by workspace kind.
  const features = useMemo<PermissionFeature[]>(() => {
    if (!workspace) return [];
    if (workspace.kind === 'org') return orgFeatures;
    if (!workspace.id) return [];
    if (workspace.kind === 'site') return featuresBySiteId[workspace.id] ?? [];
    if (workspace.kind === 'group') return featuresByGroupId[workspace.id] ?? [];
    return featuresByLeId[workspace.id] ?? [];
  }, [workspace, featuresBySiteId, featuresByGroupId, featuresByLeId, orgFeatures]);

  const isLoadingSites = phase === 'bootstrapping' || phase === 'awaitingStatus';
  const isLoadingPermissions = isLoadingSites;

  // Persist on explicit selection so the choice survives relaunch and the context header stays in sync.
  const selectWorkspace = useCallback(
    (next: ActiveWorkspace) => {
      if (workspace && workspace.kind === next.kind && workspace.id === next.id) return;
      setWorkspace(next);
      setSelectedWorkspace(next);
    },
    [workspace],
  );

  const selectSite = useCallback((siteId: string) => selectWorkspace({ kind: 'site', id: siteId }), [selectWorkspace]);

  const selectedSiteId = workspace?.kind === 'site' ? workspace.id : null;

  // After a workspace change, refetch active queries under the new context header (keeps cached data on
  // screen) and purge the workspace-scoped MMKV snapshot; skips the initial selection.
  const didInitialSelect = useRef(false);
  const workspaceKey = workspace ? `${workspace.kind}:${workspace.id ?? ''}` : null;
  useEffect(() => {
    if (!workspaceKey) return;
    if (!didInitialSelect.current) {
      didInitialSelect.current = true;
      return;
    }
    void purgeApolloPersisted();
    void apolloClient.refetchQueries({ include: 'active' });
  }, [workspaceKey]);

  const checkPermission = useMemo(
    () => buildGate(features, workspace ? KIND_SCOPE_PREFIX[workspace.kind] : null),
    [features, workspace],
  );

  const value = useMemo<PermissionContextValue>(
    () => ({
      org,
      sites,
      legalEntities,
      siteGroups,
      assignments,
      workspace,
      selectWorkspace,
      selectedSiteId,
      selectSite,
      features,
      checkPermission,
      isLoadingSites,
      isLoadingPermissions,
    }),
    [
      org,
      sites,
      legalEntities,
      siteGroups,
      assignments,
      workspace,
      selectWorkspace,
      selectedSiteId,
      selectSite,
      features,
      checkPermission,
      isLoadingSites,
      isLoadingPermissions,
    ],
  );

  // Feed the active workspace's timezone + currency and the user's locale to FormatProvider so
  // workspace-aware date/time/money components render correctly; a null locale falls back to the device locale.
  const siteMap = useMemo(() => new Map(sites.map((site) => [site.id, site])), [sites]);
  const leMap = useMemo(() => new Map(legalEntities.map((le) => [le.id, le])), [legalEntities]);
  const activeSite = workspace?.kind === 'site' && workspace.id ? (siteMap.get(workspace.id) ?? null) : null;
  const activeLe = workspace?.kind === 'le' && workspace.id ? (leMap.get(workspace.id) ?? null) : null;
  const userLocale = authState?.user?.locale ?? null;

  return (
    <PermissionContext.Provider value={value}>
      <FormatProvider
        timeZone={activeSite?.timezone ?? null}
        currency={activeSite?.currencyCode ?? activeLe?.currencyCode ?? null}
        locale={userLocale}
      >
        {children}
      </FormatProvider>
    </PermissionContext.Provider>
  );
};
