import { useAssignedBusinessUnits, useUserPermissions } from '@hooks/usePermissions';
import type { AssignedBU, PermissionFeature } from '@services/permissions.service';
import { parseSlug } from '@vritti/quantum-ui/slug';
import { setBusinessUnitTimeZone } from '@vritti/quantum-ui/timezone';
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
  const { isAuthenticated, org } = useAuth();
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

  // Only fetch BUs when authenticated
  const { data: businessUnits = [], isLoading: isLoadingBUs } = useAssignedBusinessUnits({
    enabled: isAuthenticated,
  });
  const { data: permissionsResponse, isLoading: isLoadingPermissions } = useUserPermissions(selectedBuId);

  const features = permissionsResponse?.features ?? [];

  useEffect(() => {
    for (const businessUnit of businessUnits) {
      setBusinessUnitTimeZone(businessUnit.id, businessUnit.timezone);
    }
  }, [businessUnits]);

  const selectBu = useCallback((buId: string) => {
    setSelectedBuId(buId);
  }, []);

  const contextValue = useMemo<PermissionContextValue>(
    () => ({ businessUnits, selectedBuId, selectBu, features, isLoadingBUs, isLoadingPermissions }),
    [businessUnits, selectedBuId, selectBu, features, isLoadingBUs, isLoadingPermissions],
  );

  return <PermissionContext.Provider value={contextValue}>{children}</PermissionContext.Provider>;
};

// Hook to access BU + permission state — must be used within PermissionProvider
export function usePermissionContext(): PermissionContextValue {
  return useContext(PermissionContext);
}
