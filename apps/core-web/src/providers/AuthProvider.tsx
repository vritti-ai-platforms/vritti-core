import { useAuthStatusStream } from '@hooks/auth/useAuthStatusStream';
import type { AuthOrg, User } from '@services/user.service';
import type { AssignedBU, PermissionFeature } from '@services/permissions.service';
import { useQueryClient } from '@tanstack/react-query';
import { clearToken } from '@vritti/quantum-ui/axios';
import { getLocale, setLocale } from '@vritti/quantum-ui/locale';
import { getUserTimeZone, setUserTimeZone } from '@vritti/quantum-ui/timezone';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';

interface AuthContextValue {
  user: User | undefined;
  org: AuthOrg | undefined;
  businessUnits: AssignedBU[];
  featuresByBuId: Record<string, PermissionFeature[]>;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOrgNotFound: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: undefined,
  org: undefined,
  businessUnits: [],
  featuresByBuId: {},
  isLoading: true,
  isAuthenticated: false,
  isOrgNotFound: false,
  logout: () => {},
});

// Provides auth + org state to the app via SSE stream from /auth/status
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { authResponse, isLoading } = useAuthStatusStream();

  // Caller should reload page to '/' after calling logout
  const logout = useCallback(() => {
    clearToken();
    queryClient.clear();
  }, [queryClient]);

  const isAuthenticated = authResponse?.isAuthenticated ?? false;
  const user = authResponse?.user;
  const org = authResponse?.org;
  const businessUnits = authResponse?.businessUnits ?? [];
  const featuresByBuId = authResponse?.featuresByBuId ?? {};

  useEffect(() => {
    if (!isAuthenticated) return;

    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
    const resolvedTimeZone = user?.timezone ?? getUserTimeZone() ?? browserTimeZone;
    setUserTimeZone(resolvedTimeZone);

    const browserLocale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
    const resolvedLocale = user?.locale ?? getLocale() ?? browserLocale;
    setLocale(resolvedLocale);
  }, [isAuthenticated, user?.timezone, user?.locale]);

  // Org not found = status loaded, no org returned, but subdomain exists in URL
  const hasSubdomain = typeof window !== 'undefined' && window.location.hostname.split('.').length > 2;
  const isOrgNotFound = !isLoading && !org && hasSubdomain;

  const contextValue = useMemo<AuthContextValue>(
    () => ({ user, org, businessUnits, featuresByBuId, isLoading, isAuthenticated, isOrgNotFound, logout }),
    [user, org, businessUnits, featuresByBuId, isLoading, isAuthenticated, isOrgNotFound, logout],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Hook to access auth + org state — must be used within AuthProvider
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
