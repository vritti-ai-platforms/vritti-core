import { useQueryClient } from '@tanstack/react-query';
import { clearTokens, initializeMobileSession } from '@vritti/quantum-ui-native/utils';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import mobileAxiosConfig from '../../../quantum-ui-native.config';

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
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

  const handleSignedOut = useCallback(() => {
    queryClient.clear();
    setIsAuthenticated(false);
    setIsLoading(false);
  }, [queryClient]);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      setIsLoading(true);

      try {
        const restored = await initializeMobileSession({
          ...mobileAxiosConfig,
          onSessionExpired: handleSignedOut,
        });

        if (active) {
          setIsAuthenticated(restored);
        }
      } catch {
        if (active) {
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
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    handleSignedOut();
  }, [handleSignedOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated,
      markAuthenticated,
      logout,
    }),
    [isAuthenticated, isLoading, logout, markAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
