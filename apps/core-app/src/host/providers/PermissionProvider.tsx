import { useQueryClient } from "@tanstack/react-query";
import { FormatProvider } from "@vritti/quantum-ui-native/context";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getSelectedBusinessUnitId,
  setSelectedBusinessUnitId,
} from "../config/storage";
import type { AssignedBU, PermissionFeature } from "../types/permissions";
import { useAuthSessionSnapshot } from "./AuthProvider";

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
  if (!ctx)
    throw new Error(
      "usePermissionContext must be used within PermissionProvider",
    );
  return ctx;
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface PermissionProviderProps {
  children: React.ReactNode;
}

export const PermissionProvider = ({ children }: PermissionProviderProps) => {
  const { authState, phase, sessionOrigin } = useAuthSessionSnapshot();
  const [businessUnits, setBusinessUnits] = useState<AssignedBU[]>([]);
  const [featuresByBuId, setFeaturesByBuId] = useState<
    Record<string, PermissionFeature[]>
  >({});
  const [selectedBuId, setSelectedBuId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (phase !== "authenticated" || !authState?.isAuthenticated) {
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

    // 2+ BUs. On a fresh LOGIN, leave selectedBuId null so AppRender shows the picker (ask every
    // login). On a session RESTORE (app relaunch), don't re-ask — restore the last-used BU
    // (persisted), falling back to the first if it's no longer assigned.
    if (sessionOrigin === "login") {
      return;
    }
    const persisted = getSelectedBusinessUnitId();
    const restored =
      persisted && businessUnits.some((bu) => bu.id === persisted)
        ? persisted
        : businessUnits[0]!.id;
    setSelectedBuId(restored);
    setSelectedBusinessUnitId(restored);
  }, [businessUnits, selectedBuId, sessionOrigin]);

  const features = useMemo(
    () => (selectedBuId ? (featuresByBuId[selectedBuId] ?? []) : []),
    [featuresByBuId, selectedBuId],
  );

  const isLoadingBUs = phase === "bootstrapping" || phase === "awaitingStatus";
  const isLoadingPermissions =
    phase === "bootstrapping" || phase === "awaitingStatus";

  // Persist on explicit selection so the choice survives relaunch and the x-bu-id header stays in sync.
  const selectBu = useCallback(
    (buId: string) => {
      if (buId === selectedBuId) return;
      setSelectedBuId(buId);
      setSelectedBusinessUnitId(buId);
    },
    [selectedBuId],
  );

  // After a BU change, refetch all server-state under the new x-bu-id. invalidateQueries keeps the
  // previously-cached data on screen during the background refetch — so freshly-remounted feature
  // screens never flash blank. (Using clear() here emptied the shared cache and left those screens
  // blank until a second mount.) Runs after the remount commit, so it targets the new observers;
  // skips the initial selection (nothing to refetch at login).
  const didInitialSelect = useRef(false);
  useEffect(() => {
    if (!selectedBuId) return;
    if (!didInitialSelect.current) {
      didInitialSelect.current = true;
      return;
    }
    void queryClient.invalidateQueries();
  }, [selectedBuId, queryClient]);

  const value = useMemo<PermissionContextValue>(
    () => ({
      businessUnits,
      selectedBuId,
      selectBu,
      features,
      isLoadingBUs,
      isLoadingPermissions,
    }),
    [
      businessUnits,
      selectedBuId,
      selectBu,
      features,
      isLoadingBUs,
      isLoadingPermissions,
    ],
  );

  // Feed the active BU's timezone + currency and the user's locale to quantum-ui-native's
  // FormatProvider so the BU-aware date/time components (DatePicker, DateRangePicker, DateTimePicker,
  // DateTimeRangePicker, FormattedDate) and useFormatters render in the active BU zone + user locale.
  // Switching BU or the user's locale updates this and re-renders consumers — including the micro-app
  // remotes, since the package + react are MF-shared singletons. `locale` comes from the auth-status
  // user payload (mirrors core-web's user.locale); null ⇒ components fall back to the device locale.
  const buMap = useMemo(
    () => new Map(businessUnits.map((bu) => [bu.id, bu])),
    [businessUnits],
  );
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
