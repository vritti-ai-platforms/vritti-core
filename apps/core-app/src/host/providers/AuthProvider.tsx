import { useQueryClient } from '@tanstack/react-query';
import { clearTokens, getStoredMobileBaseURL, initializeMobileSession } from '@vritti/quantum-ui-native/utils';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import mobileAxiosConfig from '../../../quantum-ui-native.config';
import { type AuthStatusResponse, useAuthStatusStream } from '../hooks/auth/useAuthStatusStream';
import type { AssignedBU, PermissionFeature } from '../services/permissions.service';

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  user?: AuthStatusResponse['user'];
  org?: AuthStatusResponse['org'];
  sessionId?: string;
  businessUnits: AssignedBU[];
  featuresByBuId: Record<string, PermissionFeature[]>;
  markAuthenticated: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasTenantBaseURL, setHasTenantBaseURL] = useState(false);
  const [authState, setAuthState] = useState<AuthStatusResponse | null>(null);

  const handleSignedOut = useCallback(() => {
    queryClient.clear();
    setAuthState(null);
    setIsAuthenticated(false);
    setHasTenantBaseURL(false);
    setIsLoading(false);
  }, [queryClient]);

  const handleAuthState = useCallback(
    (response: AuthStatusResponse) => {
      const authenticated = response.isAuthenticated === true;
      setAuthState(authenticated ? response : null);
      setIsAuthenticated(authenticated);
      setHasTenantBaseURL((previous) => previous || authenticated);
      setIsLoading(false);

      if (!authenticated) {
        queryClient.clear();
      }
    },
    [queryClient],
  );

  const handleStreamSignedOut = useCallback(async () => {
    await clearTokens();
    handleSignedOut();
  }, [handleSignedOut]);

  useAuthStatusStream({
    enabled: hasTenantBaseURL && isAuthenticated,
    onAuthState: handleAuthState,
    onSignedOut: handleStreamSignedOut,
  });

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      setIsLoading(true);

      try {
        const storedBaseURL = await getStoredMobileBaseURL();
        const restored = await initializeMobileSession({
          ...mobileAxiosConfig,
          onSessionExpired: handleSignedOut,
        });

        if (active) {
          setAuthState(null);
          setHasTenantBaseURL(!!storedBaseURL);
          setIsAuthenticated(restored);
          setIsLoading(restored && !!storedBaseURL);
        }
      } catch {
        if (active) {
          setHasTenantBaseURL(false);
          setIsAuthenticated(false);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, [handleSignedOut]);

  const markAuthenticated = useCallback(() => {
    setIsLoading(true);
    setIsAuthenticated(true);
    setHasTenantBaseURL(true);
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    handleSignedOut();
  }, [handleSignedOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated,
      user: authState?.user,
      org: authState?.org,
      sessionId: authState?.sessionId,
      businessUnits: authState?.businessUnits ?? [],
      featuresByBuId: authState?.featuresByBuId ?? {},
      markAuthenticated,
      logout,
    }),
    [authState, isAuthenticated, isLoading, logout, markAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
