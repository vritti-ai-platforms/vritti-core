import { useQueryClient } from '@tanstack/react-query';
import { clearToken, scheduleTokenRefresh, setToken } from '@vritti/quantum-ui/axios';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useAuthStatus } from '@hooks/useUser';
import type { User } from '@services/user.service';

interface AuthContextValue {
  user: User | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: undefined,
  isLoading: true,
  isAuthenticated: false,
  logout: () => {},
});

// Provides auth state to the app — after login/logout, reload the page to refresh
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

  const contextValue = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isAuthenticated, logout }),
    [user, isLoading, isAuthenticated, logout],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Hook to access auth state — must be used within AuthProvider
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
