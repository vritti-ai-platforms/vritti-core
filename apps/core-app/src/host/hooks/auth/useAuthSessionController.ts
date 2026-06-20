import { clearTokens, getStoredMobileBaseURL, initializeMobileSession } from '@vritti/quantum-ui-native/utils';
import { useCallback, useEffect, useState } from 'react';
import mobileAxiosConfig from '../../../../quantum-ui-native.config';
import { apolloClient } from '../../config/apollo';
import type { AuthStatusResponse } from '../../types/auth-status';
import { useAuthStatusStream } from './useAuthStatusStream';

export type AuthSessionPhase = 'bootstrapping' | 'signedOut' | 'awaitingStatus' | 'authenticated';
// How the current authenticated session was reached: a fresh login (show the BU picker) vs a
// session restored on app relaunch (skip the picker; restore the last-used BU).
export type AuthSessionOrigin = 'login' | 'restore' | null;

function isAuthenticatedResponse(
  response: AuthStatusResponse | null,
): response is AuthStatusResponse & { isAuthenticated: true } {
  return response?.isAuthenticated === true;
}

export function useAuthSessionController() {
  const [phase, setPhase] = useState<AuthSessionPhase>('bootstrapping');
  const [authState, setAuthState] = useState<AuthStatusResponse | null>(null);
  const [hasTenantBaseURL, setHasTenantBaseURL] = useState(false);
  const [sessionOrigin, setSessionOrigin] = useState<AuthSessionOrigin>(null);

  const resetSignedOutState = useCallback(() => {
    void apolloClient.clearStore();
    setAuthState(null);
    setHasTenantBaseURL(false);
    setSessionOrigin(null);
    setPhase('signedOut');
  }, []);

  const { authState: streamAuthState } = useAuthStatusStream(
    hasTenantBaseURL && (phase === 'awaitingStatus' || phase === 'authenticated'),
  );

  useEffect(() => {
    if (!streamAuthState) return;

    if (isAuthenticatedResponse(streamAuthState)) {
      setAuthState(streamAuthState);
      setHasTenantBaseURL(true);
      setPhase('authenticated');
      return;
    }

    void clearTokens().finally(resetSignedOutState);
  }, [resetSignedOutState, streamAuthState]);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      setPhase('bootstrapping');

      try {
        const restored = await initializeMobileSession({
          ...mobileAxiosConfig,
          onSessionExpired: resetSignedOutState,
        });
        const storedBaseURL = await getStoredMobileBaseURL();

        if (!active) return;

        setAuthState(null);
        setHasTenantBaseURL(!!storedBaseURL);
        if (restored && !!storedBaseURL) {
          // Reached by restoring stored tokens on app relaunch — not a fresh login, so the
          // BU picker is skipped and the last-used BU is restored.
          setSessionOrigin('restore');
          setPhase('awaitingStatus');
        } else {
          setPhase('signedOut');
        }
      } catch {
        if (active) {
          setAuthState(null);
          setHasTenantBaseURL(false);
          setPhase('signedOut');
        }
      }
    };

    void restoreSession();

    return () => {
      active = false;
    };
  }, [resetSignedOutState]);

  const beginStatusConfirmation = useCallback(() => {
    setAuthState(null);
    setHasTenantBaseURL(true);
    // Fresh login — the BU picker should appear after this (every login asks).
    setSessionOrigin('login');
    setPhase('awaitingStatus');
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    resetSignedOutState();
  }, [resetSignedOutState]);

  return {
    phase,
    authState,
    sessionOrigin,
    beginStatusConfirmation,
    logout,
  };
}
