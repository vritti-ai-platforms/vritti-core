import { useQueryClient } from '@tanstack/react-query';
import { clearToken, scheduleTokenRefresh, setToken } from '@vritti/quantum-ui/axios';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useAuthStatus } from '@hooks/useUser';
import type { AuthOrg, User } from '@services/user.service';

interface AuthContextValue {
  user: User | undefined;
  org: AuthOrg | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOrgNotFound: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: undefined,
  org: undefined,
  isLoading: true,
  isAuthenticated: false,
  isOrgNotFound: false,
  logout: () => {},
});

// Provides auth + org state to the app — after login/logout, reload the page to refresh
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { data: authResponse, isLoading, isSuccess } = useAuthStatus();

  // Store access token in memory and schedule proactive refresh
  useEffect(() => {
    if (isSuccess && authResponse.isAuthenticated && authResponse.accessToken && authResponse.expiresIn) {
      setToken(authResponse.accessToken);
      scheduleTokenRefresh(authResponse.expiresIn);
    }
  }, [isSuccess, authResponse]);

  // Caller should reload page to '/' after calling logout
  const logout = useCallback(() => {
    clearToken();
    queryClient.clear();
  }, [queryClient]);

  const isAuthenticated = authResponse?.isAuthenticated ?? false;
  const user = authResponse?.user;
  const org = authResponse?.org;

  // Org not found = status loaded, no org returned, but subdomain exists in URL
  const hasSubdomain = typeof window !== 'undefined' && window.location.hostname.split('.').length > 2;
  const isOrgNotFound = !isLoading && !org && hasSubdomain;

  const contextValue = useMemo<AuthContextValue>(
    () => ({ user, org, isLoading, isAuthenticated, isOrgNotFound, logout }),
    [user, org, isLoading, isAuthenticated, isOrgNotFound, logout],
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
