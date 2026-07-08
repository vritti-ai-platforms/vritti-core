import { FormatProvider } from '@vritti/quantum-ui-native/context';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apolloClient, purgeApolloPersisted } from '../config/apollo';
import { getSelectedBusinessUnitId, setSelectedBusinessUnitId } from '../config/storage';
import type { AssignedBU, PermissionFeature } from '../types/permissions';
import { useAuthSessionSnapshot } from './AuthProvider';

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

interface PermissionProviderProps {
  children: React.ReactNode;
}

export const PermissionProvider = ({ children }: PermissionProviderProps) => {
  const { authState, phase, sessionOrigin } = useAuthSessionSnapshot();
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

    // Single BU — nothing to choose.
    if (businessUnits.length === 1) {
      const only = businessUnits[0]!.id;
      setSelectedBuId(only);
      setSelectedBusinessUnitId(only);
      return;
    }

    // 2+ BUs: on a fresh LOGIN leave selectedBuId null so the picker shows; on RESTORE re-use the last-used BU, falling back to the first.
    if (sessionOrigin === 'login') {
      return;
    }
    const persisted = getSelectedBusinessUnitId();
    const restored = persisted && businessUnits.some((bu) => bu.id === persisted) ? persisted : businessUnits[0]!.id;
    setSelectedBuId(restored);
    setSelectedBusinessUnitId(restored);
  }, [businessUnits, selectedBuId, sessionOrigin]);

  const features = useMemo(
    () => (selectedBuId ? (featuresByBuId[selectedBuId] ?? []) : []),
    [featuresByBuId, selectedBuId],
  );

  const isLoadingBUs = phase === 'bootstrapping' || phase === 'awaitingStatus';
  const isLoadingPermissions = phase === 'bootstrapping' || phase === 'awaitingStatus';

  // Persist on explicit selection so the choice survives relaunch and the x-bu-id header stays in sync.
  const selectBu = useCallback(
    (buId: string) => {
      if (buId === selectedBuId) return;
      setSelectedBuId(buId);
      setSelectedBusinessUnitId(buId);
    },
    [selectedBuId],
  );

  // After a BU change, refetch active queries under the new x-bu-id (keeps cached data on screen) and purge the BU-scoped MMKV snapshot; skips the initial selection.
  const didInitialSelect = useRef(false);
  useEffect(() => {
    if (!selectedBuId) return;
    if (!didInitialSelect.current) {
      didInitialSelect.current = true;
      return;
    }
    void purgeApolloPersisted();
    void apolloClient.refetchQueries({ include: 'active' });
  }, [selectedBuId]);

  const value = useMemo<PermissionContextValue>(
    () => ({
      businessUnits,
      selectedBuId,
      selectBu,
      features,
      isLoadingBUs,
      isLoadingPermissions,
    }),
    [businessUnits, selectedBuId, selectBu, features, isLoadingBUs, isLoadingPermissions],
  );

  // Feed the active BU's timezone + currency and the user's locale to FormatProvider so BU-aware date/time components render correctly; null locale falls back to the device locale.
  const buMap = useMemo(() => new Map(businessUnits.map((bu) => [bu.id, bu])), [businessUnits]);
  const activeBu = selectedBuId ? (buMap.get(selectedBuId) ?? null) : null;
  const userLocale = authState?.user?.locale ?? null;

  return (
    <PermissionContext.Provider value={value}>
      <FormatProvider
        timeZone={activeBu?.timezone ?? null}
        currency={activeBu?.currencyCode ?? null}
        locale={userLocale}
      >
        {children}
      </FormatProvider>
    </PermissionContext.Provider>
  );
};
