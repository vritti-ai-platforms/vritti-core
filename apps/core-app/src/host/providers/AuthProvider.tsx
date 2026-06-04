import React, { createContext, useContext, useMemo } from 'react';
import { type AuthSessionPhase, useAuthSessionController } from '../hooks/auth/useAuthSessionController';
import type { AuthStatusResponse } from '../types/auth-status';

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  user?: AuthStatusResponse['user'];
  org?: AuthStatusResponse['org'];
  sessionId?: string;
  beginStatusConfirmation: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AuthSessionSnapshotContext = createContext<{
  phase: AuthSessionPhase;
  authState: AuthStatusResponse | null;
} | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const useAuthSessionSnapshot = () => {
  const ctx = useContext(AuthSessionSnapshotContext);
  if (!ctx) throw new Error('useAuthSessionSnapshot must be used within AuthProvider');
  return ctx;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { phase, authState, beginStatusConfirmation, logout } = useAuthSessionController();

  const isLoading = phase === 'bootstrapping' || phase === 'awaitingStatus';
  const isAuthenticated = phase === 'authenticated';

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated,
      user: authState?.user,
      org: authState?.org,
      sessionId: authState?.sessionId,
      beginStatusConfirmation,
      logout,
    }),
    [authState, beginStatusConfirmation, isAuthenticated, isLoading, logout],
  );

  const sessionSnapshot = useMemo(
    () => ({
      phase,
      authState,
    }),
    [authState, phase],
  );

  return (
    <AuthSessionSnapshotContext.Provider value={sessionSnapshot}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </AuthSessionSnapshotContext.Provider>
  );
};
