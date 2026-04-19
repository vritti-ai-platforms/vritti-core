import { useQueryClient } from '@tanstack/react-query';
import { clearTokens, getStoredMobileBaseURL, initializeMobileSession } from '@vritti/quantum-ui-native/utils';
import { useCallback, useEffect, useState } from 'react';
import mobileAxiosConfig from '../../../../quantum-ui-native.config';
import type { AuthStatusResponse } from '../../types/auth-status';
import { useAuthStatusStream } from './useAuthStatusStream';

export type AuthSessionPhase = 'bootstrapping' | 'signedOut' | 'awaitingStatus' | 'authenticated';

function isAuthenticatedResponse(response: AuthStatusResponse | null): response is AuthStatusResponse & { isAuthenticated: true } {
  return response?.isAuthenticated === true;
}

export function useAuthSessionController() {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<AuthSessionPhase>('bootstrapping');
  const [authState, setAuthState] = useState<AuthStatusResponse | null>(null);
  const [hasTenantBaseURL, setHasTenantBaseURL] = useState(false);

  const resetSignedOutState = useCallback(() => {
    queryClient.clear();
    setAuthState(null);
    setHasTenantBaseURL(false);
    setPhase('signedOut');
  }, [queryClient]);

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
        setPhase(restored && !!storedBaseURL ? 'awaitingStatus' : 'signedOut');
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
    setPhase('awaitingStatus');
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    resetSignedOutState();
  }, [resetSignedOutState]);

  return {
    phase,
    authState,
    beginStatusConfirmation,
    logout,
  };
}
