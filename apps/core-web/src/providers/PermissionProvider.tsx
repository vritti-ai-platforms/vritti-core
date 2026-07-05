import type { AssignedBU } from '@services/permissions.service';
import { setBusinessUnitCurrency } from '@vritti/quantum-ui/currency';
import {
  type PermissionGateFn,
  PermissionGateProvider,
  type PermissionGateResult,
} from '@vritti/quantum-ui/PermissionGate';
import { parseSlug } from '@vritti/quantum-ui/slug';
import { setBusinessUnitTimeZone } from '@vritti/quantum-ui/timezone';
import type { PermissionFeature } from '@vritti/quantum-ui/types/catalog-resolver';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface PermissionContextValue {
  businessUnits: AssignedBU[];
  selectedBuId: string | null;
  selectBu: (buId: string) => void;
  features: PermissionFeature[];
  isLoadingBUs: boolean;
  isLoadingPermissions: boolean;
}

const PermissionContext = createContext<PermissionContextValue>({
  businessUnits: [],
  selectedBuId: null,
  selectBu: () => {},
  features: [],
  isLoadingBUs: false,
  isLoadingPermissions: false,
});

const DENY: PermissionGateResult = Object.freeze({ granted: false, locked: false, reason: null, unlockPlans: [] });

// Resolves a "feature.permission" code against the selected BU's resolved features
function buildGate(features: PermissionFeature[]): PermissionGateFn {
  return (code) => {
    const dotIndex = code.indexOf('.');
    const featureCode = dotIndex === -1 ? code : code.slice(0, dotIndex);
    const permissionCode = dotIndex === -1 ? null : code.slice(dotIndex + 1);
    const feature = features.find((f) => f.code === featureCode);
    if (!feature) return DENY;
    if (!permissionCode)
      return { granted: true, locked: feature.locked, reason: feature.lockReason, unlockPlans: feature.unlockPlans };
    if (!feature.permissions.includes(permissionCode)) return DENY;
    if (feature.locked)
      return { granted: true, locked: true, reason: feature.lockReason, unlockPlans: feature.unlockPlans };
    const permissionLock = feature.lockedPermissions.find((p) => p.code === permissionCode);
    if (permissionLock)
      return { granted: true, locked: true, reason: permissionLock.reason, unlockPlans: permissionLock.unlockPlans };
    return { granted: true, locked: false, reason: null, unlockPlans: [] };
  };
}

// Extracts buId from URL path like /bu-Name~uuid/products
function extractBuIdFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  const buSegment = segments.find((s) => s.startsWith('bu-'));
  if (!buSegment) return null;
  const parsed = parseSlug(buSegment.replace(/^bu-/, ''));
  return parsed?.id ?? null;
}

// Provides BU selection and resolved permissions to the app
export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { org, businessUnits, featuresByBuId, isLoading } = useAuth();
  const location = useLocation();

  // Derive buId from URL
  const urlBuId = extractBuIdFromPath(location.pathname);
  const [selectedBuId, setSelectedBuId] = useState<string | null>(urlBuId);

  // Sync with URL changes
  useEffect(() => {
    if (urlBuId) setSelectedBuId(urlBuId);
  }, [urlBuId]);

  // Store org ID in localStorage for commerce-mf to read
  useEffect(() => {
    if (org?.id) localStorage.setItem('vritti_org_id', org.id);
  }, [org?.id]);

  // BUs + features now arrive in the SSE auth-state payload (AuthProvider) — no separate fetch.
  const features = selectedBuId ? (featuresByBuId[selectedBuId] ?? []) : [];

  useEffect(() => {
    for (const businessUnit of businessUnits) {
      setBusinessUnitTimeZone(businessUnit.id, businessUnit.timezone);
      setBusinessUnitCurrency(businessUnit.id, businessUnit.currencyCode);
    }
  }, [businessUnits]);

  const selectBu = useCallback((buId: string) => {
    setSelectedBuId(buId);
  }, []);

  const contextValue = useMemo<PermissionContextValue>(
    () => ({
      businessUnits,
      selectedBuId,
      selectBu,
      features,
      isLoadingBUs: isLoading,
      isLoadingPermissions: isLoading,
    }),
    [businessUnits, selectedBuId, selectBu, features, isLoading],
  );

  const gate = useMemo(() => buildGate(features), [features]);

  return (
    <PermissionContext.Provider value={contextValue}>
      <PermissionGateProvider value={gate}>{children}</PermissionGateProvider>
    </PermissionContext.Provider>
  );
};

// Hook to access BU + permission state — must be used within PermissionProvider
export function usePermissionContext(): PermissionContextValue {
  return useContext(PermissionContext);
}
