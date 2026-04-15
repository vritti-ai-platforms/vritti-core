import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PermissionFeature, AssignedBU } from '../services/permissions.service';
import { useAssignedBusinessUnits, useUserPermissions } from '../hooks/usePermissions';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface PermissionContextValue {
  businessUnits: AssignedBU[];
  selectedBuId: string | null;
  selectBu: (buId: string) => void;
  features: PermissionFeature[];
  isLoadingBUs: boolean;
  isLoadingPermissions: boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function usePermissionContext(): PermissionContextValue {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error('usePermissionContext must be used within PermissionProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface PermissionProviderProps {
  children: React.ReactNode;
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  const [selectedBuId, setSelectedBuId] = useState<string | null>(null);

  const {
    data: businessUnits = [],
    isLoading: isLoadingBUs,
  } = useAssignedBusinessUnits();

  const {
    data: permissionsData,
    isLoading: isLoadingPermissions,
  } = useUserPermissions(selectedBuId);

  // Auto-select first BU when loaded
  useEffect(() => {
    if (!selectedBuId && businessUnits.length > 0) {
      setSelectedBuId(businessUnits[0]!.id);
    }
  }, [businessUnits, selectedBuId]);

  const features = useMemo(
    () => permissionsData?.features ?? [],
    [permissionsData],
  );

  const value = useMemo<PermissionContextValue>(
    () => ({
      businessUnits,
      selectedBuId,
      selectBu: setSelectedBuId,
      features,
      isLoadingBUs,
      isLoadingPermissions,
    }),
    [businessUnits, selectedBuId, features, isLoadingBUs, isLoadingPermissions],
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}
