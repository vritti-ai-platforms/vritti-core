import { FormatProvider } from '@vritti/quantum-ui-native/context';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apolloClient, purgeApolloPersisted } from '../config/apollo';
import { getSelectedSiteId, setSelectedSiteId as persistSelectedSiteId } from '../config/storage';
import type { AssignedSite, PermissionFeature } from '../types/permissions';
import { useAuthSessionSnapshot } from './AuthProvider';

interface PermissionContextValue {
  sites: AssignedSite[];
  selectedSiteId: string | null;
  selectSite: (siteId: string) => void;
  features: PermissionFeature[];
  isLoadingSites: boolean;
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
  const [sites, setSites] = useState<AssignedSite[]>([]);
  const [featuresBySiteId, setFeaturesBySiteId] = useState<Record<string, PermissionFeature[]>>({});
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  useEffect(() => {
    if (phase !== 'authenticated' || !authState?.isAuthenticated) {
      setSites([]);
      setFeaturesBySiteId({});
      setSelectedSiteId(null);
      return;
    }

    setSites(authState.sites ?? []);
    setFeaturesBySiteId(authState.featuresBySiteId ?? {});
  }, [authState, phase]);

  useEffect(() => {
    if (sites.length === 0) {
      setSelectedSiteId(null);
      return;
    }

    if (selectedSiteId && sites.some((site) => site.id === selectedSiteId)) {
      return;
    }

    // Single site — nothing to choose.
    if (sites.length === 1) {
      const only = sites[0]!.id;
      setSelectedSiteId(only);
      persistSelectedSiteId(only);
      return;
    }

    // 2+ sites: on a fresh LOGIN leave selectedSiteId null so the picker shows; on RESTORE re-use the last-used site, falling back to the first.
    if (sessionOrigin === 'login') {
      return;
    }
    const persisted = getSelectedSiteId();
    const restored = persisted && sites.some((site) => site.id === persisted) ? persisted : sites[0]!.id;
    setSelectedSiteId(restored);
    persistSelectedSiteId(restored);
  }, [sites, selectedSiteId, sessionOrigin]);

  const features = useMemo(
    () => (selectedSiteId ? (featuresBySiteId[selectedSiteId] ?? []) : []),
    [featuresBySiteId, selectedSiteId],
  );

  const isLoadingSites = phase === 'bootstrapping' || phase === 'awaitingStatus';
  const isLoadingPermissions = phase === 'bootstrapping' || phase === 'awaitingStatus';

  // Persist on explicit selection so the choice survives relaunch and the x-site-id header stays in sync.
  const selectSite = useCallback(
    (siteId: string) => {
      if (siteId === selectedSiteId) return;
      setSelectedSiteId(siteId);
      persistSelectedSiteId(siteId);
    },
    [selectedSiteId],
  );

  // After a site change, refetch active queries under the new x-site-id (keeps cached data on screen) and purge the site-scoped MMKV snapshot; skips the initial selection.
  const didInitialSelect = useRef(false);
  useEffect(() => {
    if (!selectedSiteId) return;
    if (!didInitialSelect.current) {
      didInitialSelect.current = true;
      return;
    }
    void purgeApolloPersisted();
    void apolloClient.refetchQueries({ include: 'active' });
  }, [selectedSiteId]);

  const value = useMemo<PermissionContextValue>(
    () => ({
      sites,
      selectedSiteId,
      selectSite,
      features,
      isLoadingSites,
      isLoadingPermissions,
    }),
    [sites, selectedSiteId, selectSite, features, isLoadingSites, isLoadingPermissions],
  );

  // Feed the active site's timezone + currency and the user's locale to FormatProvider so site-aware date/time components render correctly; null locale falls back to the device locale.
  const siteMap = useMemo(() => new Map(sites.map((site) => [site.id, site])), [sites]);
  const activeSite = selectedSiteId ? (siteMap.get(selectedSiteId) ?? null) : null;
  const userLocale = authState?.user?.locale ?? null;

  return (
    <PermissionContext.Provider value={value}>
      <FormatProvider
        timeZone={activeSite?.timezone ?? null}
        currency={activeSite?.currencyCode ?? null}
        locale={userLocale}
      >
        {children}
      </FormatProvider>
    </PermissionContext.Provider>
  );
};
