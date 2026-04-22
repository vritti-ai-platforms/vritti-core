import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PermissionFeature, AssignedBU } from '../types/permissions';
import { useAuthSessionSnapshot } from './AuthProvider';

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

export const usePermissionContext = (): PermissionContextValue => {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error('usePermissionContext must be used within PermissionProvider');
  return ctx;
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface PermissionProviderProps {
  children: React.ReactNode;
}

export const PermissionProvider = ({ children }: PermissionProviderProps) => {
  const { authState, phase } = useAuthSessionSnapshot();
  const [businessUnits, setBusinessUnits] = useState<AssignedBU[]>([]);
  const [featuresByBuId, setFeaturesByBuId] = useState<Record<string, PermissionFeature[]>>({});
  const [selectedBuId, setSelectedBuId] = useState<string | null>(null);

  useEffect(() => {
    if (phase !== 'authenticated' || !authState?.isAuthenticated) {
      setBusinessUnits([]);
      setFeaturesByBuId({});
      setSelectedBuId(null);
      return;
    }

    setBusinessUnits(authState.businessUnits ?? []);
    setFeaturesByBuId(authState.featuresByBuId ?? {});
  }, [authState, phase]);

  useEffect(() => {
    if (businessUnits.length === 0) {
      setSelectedBuId(null);
      return;
    }

    if (selectedBuId && businessUnits.some((bu) => bu.id === selectedBuId)) {
      return;
    }

    setSelectedBuId(businessUnits[0]!.id);
  }, [businessUnits, selectedBuId]);

  const features = useMemo(
    () => (selectedBuId ? featuresByBuId[selectedBuId] ?? [] : []),
    [featuresByBuId, selectedBuId],
  );

  const isLoadingBUs = phase === 'bootstrapping' || phase === 'awaitingStatus';
  const isLoadingPermissions = phase === 'bootstrapping' || phase === 'awaitingStatus';

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
};
