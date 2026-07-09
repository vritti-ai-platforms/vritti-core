import {
  clearTokens,
  getStoredMobileBaseURL,
  initializeMobileSession,
  setMobileBaseURL,
} from '@vritti/quantum-ui-native/utils';
import { useCallback, useEffect, useState } from 'react';
import mobileAxiosConfig from '../../../../quantum-ui-native.config';
import { purgeApolloCache } from '../../config/apollo';
import { config } from '../../config/env';
import type { AuthStatusResponse } from '../../types/auth-status';
import { useAuthStatusStream } from './useAuthStatusStream';

export type AuthSessionPhase = 'bootstrapping' | 'signedOut' | 'awaitingStatus' | 'authenticated';
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
    void purgeApolloCache();
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
        // Dev: pin API_BASE_URL over any stored deployment/tenant URL so all traffic targets it (no-op in prod).
        if (config.api.devRawCoreBaseUrl) {
          await setMobileBaseURL(config.api.devRawCoreBaseUrl);
        }
        const storedBaseURL = await getStoredMobileBaseURL();

        if (!active) return;

        setAuthState(null);
        setHasTenantBaseURL(!!storedBaseURL);
        if (restored && !!storedBaseURL) {
          // Restored from stored tokens on relaunch — not a fresh login, so skip the picker and restore the last-used BU.
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
