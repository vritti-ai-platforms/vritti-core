import type { AssignedLegalEntity, AssignedRole, AssignedSite, AssignedSiteGroup } from '@services/permissions.service';
import { type ActiveWorkspace, extractWorkspaceFromPath, type WorkspaceKind } from '@utils/workspace';
import { OrgContextProvider, type OrgContextValue } from '@vritti/quantum-ui/context';
import { setBusinessUnitCurrency } from '@vritti/quantum-ui/currency';
import { useTheme } from '@vritti/quantum-ui/hooks';
import {
  type PermissionGateFn,
  PermissionGateProvider,
  type PermissionGateResult,
} from '@vritti/quantum-ui/PermissionGate';
import { setBusinessUnitTimeZone } from '@vritti/quantum-ui/timezone';
import type { PermissionFeature, ServiceCode } from '@vritti/quantum-ui/types/catalog-resolver';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface PermissionContextValue {
  sites: AssignedSite[];
  legalEntities: AssignedLegalEntity[];
  siteGroups: AssignedSiteGroup[];
  assignments: AssignedRole[];
  workspace: ActiveWorkspace | null;
  selectWorkspace: (workspace: ActiveWorkspace) => void;
  selectedSiteId: string | null;
  selectSite: (siteId: string) => void;
  features: PermissionFeature[];
  isLoadingSites: boolean;
  isLoadingPermissions: boolean;
}

export const LAST_SITE_STORAGE_KEY = 'vritti_last_site_id';
export const LAST_WORKSPACE_STORAGE_KEY = 'vritti_last_workspace';

const PermissionContext = createContext<PermissionContextValue>({
  sites: [],
  legalEntities: [],
  siteGroups: [],
  assignments: [],
  workspace: null,
  selectWorkspace: () => {},
  selectedSiteId: null,
  selectSite: () => {},
  features: [],
  isLoadingSites: false,
  isLoadingPermissions: false,
});

const DENY: PermissionGateResult = Object.freeze({
  granted: false,
  locked: false,
  reason: null,
  unlockPlans: [],
  missingServices: [],
  available: false,
  featureName: null,
});

// Builds a granted result, deriving `available` (granted && !locked) so it's always consistent
function grant(
  locked: boolean,
  reason: PermissionGateResult['reason'],
  unlockPlans: string[],
  featureName: string,
  missingServices: ServiceCode[] = [],
): PermissionGateResult {
  return { granted: true, locked, reason, unlockPlans, missingServices, available: !locked, featureName };
}

// Denied but the feature is known — carries its name so messages can stay feature-specific
function deny(featureName: string): PermissionGateResult {
  return {
    granted: false,
    locked: false,
    reason: null,
    unlockPlans: [],
    missingServices: [],
    available: false,
    featureName,
  };
}

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

// Resolves a "[scope.]feature.permission" code against the active workspace's resolved features
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
    if (!permissionCode)
      return grant(feature.locked, feature.lockReason, feature.unlockPlans, feature.name, feature.missingServices);
    if (!feature.permissions.includes(permissionCode)) return deny(feature.name);
    if (feature.locked)
      return grant(true, feature.lockReason, feature.unlockPlans, feature.name, feature.missingServices);
    const permissionLock = feature.lockedPermissions.find((p) => p.code === permissionCode);
    if (permissionLock)
      return grant(
        true,
        permissionLock.reason,
        permissionLock.unlockPlans,
        feature.name,
        permissionLock.missingServices,
      );
    return grant(false, null, [], feature.name);
  };
}

// Provides workspace selection and resolved permissions to the app
export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  const {
    org,
    sites,
    legalEntities,
    siteGroups,
    assignments,
    featuresBySiteId,
    featuresByGroupId,
    featuresByLeId,
    orgFeatures,
    isLoading,
  } = useAuth();
  const location = useLocation();

  // Derive the active workspace from the URL
  const urlWorkspace = useMemo(() => extractWorkspaceFromPath(location.pathname), [location.pathname]);
  const [workspace, setWorkspace] = useState<ActiveWorkspace | null>(urlWorkspace);

  // Sync with URL changes — clears when navigating back to workspace selection
  useEffect(() => {
    setWorkspace(urlWorkspace);
  }, [urlWorkspace]);

  // Store org ID in localStorage for commerce-mf and the axios onRequest hook (/org → x-org-id) to read
  useEffect(() => {
    if (org?.id) localStorage.setItem('vritti_org_id', org.id);
  }, [org?.id]);

  // Features arrive in the SSE auth-state payload (AuthProvider), keyed by workspace kind
  const features = useMemo<PermissionFeature[]>(() => {
    if (!workspace) return [];
    if (workspace.kind === 'org') return orgFeatures;
    if (!workspace.id) return [];
    if (workspace.kind === 'site') return featuresBySiteId[workspace.id] ?? [];
    if (workspace.kind === 'group') return featuresByGroupId[workspace.id] ?? [];
    return featuresByLeId[workspace.id] ?? [];
  }, [workspace, featuresBySiteId, featuresByGroupId, featuresByLeId, orgFeatures]);

  useEffect(() => {
    for (const site of sites) {
      setBusinessUnitTimeZone(site.id, site.timezone);
      setBusinessUnitCurrency(site.id, site.currencyCode);
    }
  }, [sites]);

  // LEs carry a currency but no timezone — their timezone falls back to the user's
  useEffect(() => {
    for (const le of legalEntities) {
      setBusinessUnitCurrency(le.id, le.currencyCode);
    }
  }, [legalEntities]);

  const selectWorkspace = useCallback((next: ActiveWorkspace) => {
    setWorkspace(next);
    localStorage.setItem(LAST_WORKSPACE_STORAGE_KEY, JSON.stringify(next));
    if (next.kind === 'site' && next.id) localStorage.setItem(LAST_SITE_STORAGE_KEY, next.id);
  }, []);

  const selectSite = useCallback((siteId: string) => selectWorkspace({ kind: 'site', id: siteId }), [selectWorkspace]);

  const selectedSiteId = workspace?.kind === 'site' ? workspace.id : null;

  const contextValue = useMemo<PermissionContextValue>(
    () => ({
      sites,
      legalEntities,
      siteGroups,
      assignments,
      workspace,
      selectWorkspace,
      selectedSiteId,
      selectSite,
      features,
      isLoadingSites: isLoading,
      isLoadingPermissions: isLoading,
    }),
    [
      sites,
      legalEntities,
      siteGroups,
      assignments,
      workspace,
      selectWorkspace,
      selectedSiteId,
      selectSite,
      features,
      isLoading,
    ],
  );

  const gate = useMemo(
    () => buildGate(features, workspace ? KIND_SCOPE_PREFIX[workspace.kind] : null),
    [features, workspace],
  );

  // Published to federated remotes so they read the org (and its git namespace) from the auth stream
  // instead of refetching it — see quantum-ui/lib/context/OrgContext.tsx
  const orgContextValue = useMemo<OrgContextValue>(
    () => ({
      id: org?.id ?? null,
      name: org?.name ?? null,
      subdomain: org?.subdomain ?? null,
      logoUrl: (theme === 'dark' ? org?.logoDarkUrl : org?.logoLightUrl) ?? null,
      services: org?.services ?? [],
    }),
    [org, theme],
  );

  return (
    <PermissionContext.Provider value={contextValue}>
      <OrgContextProvider value={orgContextValue}>
        <PermissionGateProvider value={gate}>{children}</PermissionGateProvider>
      </OrgContextProvider>
    </PermissionContext.Provider>
  );
};

// Hook to access workspace + permission state — must be used within PermissionProvider
export function usePermissionContext(): PermissionContextValue {
  return useContext(PermissionContext);
}
