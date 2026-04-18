import { getAxios, getToken } from '@vritti/quantum-ui-native/utils';
import { useEffect, useState } from 'react';
import EventSource from 'react-native-sse';
import type { AuthStatusResponse } from '../../types/auth-status';

function buildAuthStatusUrl(baseURL: string): string {
  return `${baseURL.replace(/\/$/, '')}/auth/status`;
}

export function useAuthStatusStream(enabled: boolean) {
  const [authState, setAuthState] = useState<AuthStatusResponse | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const token = getToken();
  const baseURL = getAxios().defaults.baseURL;

  useEffect(() => {
    if (!enabled || !token || !baseURL) {
      setIsConnected(false);
      return;
    }

    const eventSource = new EventSource<'auth-state'>(buildAuthStatusUrl(baseURL), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      pollingInterval: 0,
    });

    const handleAuthState = (event: { data?: string | null }) => {
      if (!event.data) return;

      try {
        setAuthState(JSON.parse(event.data) as AuthStatusResponse);
      } catch {
        // Ignore malformed SSE payloads and keep the stream alive.
      }
    };

    const handleOpen = () => {
      setIsConnected(true);
      console.log('[auth-status] SSE connected');
    };

    const handleError = (event: { type?: string; message?: string | null }) => {
      setIsConnected(false);
      console.warn('[auth-status] SSE error', event?.type, event?.message ?? '');
    };

    eventSource.addEventListener('open', handleOpen);
    eventSource.addEventListener('auth-state', handleAuthState);
    eventSource.addEventListener('error', handleError);

    return () => {
      setIsConnected(false);
      eventSource.removeAllEventListeners();
      eventSource.close();
    };
  }, [baseURL, enabled, token]);

  return { authState, isConnected };
}
