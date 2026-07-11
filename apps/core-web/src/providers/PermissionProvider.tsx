import type { AssignedLegalEntity, AssignedRole, AssignedSite, AssignedSiteGroup } from '@services/permissions.service';
import { type ActiveWorkspace, extractWorkspaceFromPath } from '@utils/workspace';
import { setBusinessUnitCurrency } from '@vritti/quantum-ui/currency';
import {
  type PermissionGateFn,
  PermissionGateProvider,
  type PermissionGateResult,
} from '@vritti/quantum-ui/PermissionGate';
import { setBusinessUnitTimeZone } from '@vritti/quantum-ui/timezone';
import type { PermissionFeature } from '@vritti/quantum-ui/types/catalog-resolver';
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
  available: false,
  featureName: null,
});

// Builds a granted result, deriving `available` (granted && !locked) so it's always consistent
function grant(
  locked: boolean,
  reason: PermissionGateResult['reason'],
  unlockPlans: string[],
  featureName: string,
): PermissionGateResult {
  return { granted: true, locked, reason, unlockPlans, available: !locked, featureName };
}

// Denied but the feature is known — carries its name so messages can stay feature-specific
function deny(featureName: string): PermissionGateResult {
  return { granted: false, locked: false, reason: null, unlockPlans: [], available: false, featureName };
}

// Resolves a "feature.permission" code against the active workspace's resolved features
function buildGate(features: PermissionFeature[]): PermissionGateFn {
  return (code) => {
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

// Provides workspace selection and resolved permissions to the app
export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const gate = useMemo(() => buildGate(features), [features]);

  return (
    <PermissionContext.Provider value={contextValue}>
      <PermissionGateProvider value={gate}>{children}</PermissionGateProvider>
    </PermissionContext.Provider>
  );
};

// Hook to access workspace + permission state — must be used within PermissionProvider
export function usePermissionContext(): PermissionContextValue {
  return useContext(PermissionContext);
}
