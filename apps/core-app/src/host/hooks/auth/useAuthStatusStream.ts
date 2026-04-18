import { getAxios, getToken } from '@vritti/quantum-ui-native/utils';
import { useEffect, useRef } from 'react';
import EventSource from 'react-native-sse';
import type { AssignedBU, PermissionFeature } from '../../services/permissions.service';

interface AuthStatusUser {
  id: string;
  email: string;
  fullName: string;
  status: string;
  hasPassword: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

interface AuthStatusOrg {
  id: string;
  name: string;
  subdomain: string;
  logoUrl: string | null;
}

export interface AuthStatusResponse {
  isAuthenticated?: boolean;
  sessionId?: string;
  user?: AuthStatusUser;
  org?: AuthStatusOrg;
  businessUnits?: AssignedBU[];
  featuresByBuId?: Record<string, PermissionFeature[]>;
}

interface UseAuthStatusStreamOptions {
  enabled: boolean;
  onAuthState: (response: AuthStatusResponse) => void;
  onSignedOut: () => void | Promise<void>;
}

type AuthStatusEvent = {
  data?: string | null;
};

function buildAuthStatusUrl(baseURL: string): string {
  return `${baseURL.replace(/\/$/, '')}/auth/status`;
}

export function useAuthStatusStream({ enabled, onAuthState, onSignedOut }: UseAuthStatusStreamOptions) {
  const onAuthStateRef = useRef(onAuthState);
  const onSignedOutRef = useRef(onSignedOut);
  const token = getToken();
  const baseURL = getAxios().defaults.baseURL;

  useEffect(() => {
    onAuthStateRef.current = onAuthState;
    onSignedOutRef.current = onSignedOut;
  }, [onAuthState, onSignedOut]);

  useEffect(() => {
    if (!enabled) return;

    if (!token || !baseURL) return;

    const eventSource = new EventSource<'auth-state'>(buildAuthStatusUrl(baseURL), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      pollingInterval: 0,
    });

    const handleAuthState = async (event: AuthStatusEvent) => {
      if (!event.data) return;

      try {
        const response = JSON.parse(event.data) as AuthStatusResponse;
        onAuthStateRef.current(response);

        if (response.isAuthenticated === false) {
          await onSignedOutRef.current();
        }
      } catch {
        // Ignore malformed SSE payloads and keep the stream alive.
      }
    };

    const handleOpen = () => {
      console.log('[auth-status] SSE connected');
    };

    const handleError = (event: { type?: string; message?: string | null }) => {
      console.warn('[auth-status] SSE error', event?.type, event?.message ?? '');
    };

    eventSource.addEventListener('open', handleOpen);
    eventSource.addEventListener('auth-state', handleAuthState);
    eventSource.addEventListener('error', handleError);

    return () => {
      eventSource.removeAllEventListeners();
      eventSource.close();
    };
  }, [baseURL, enabled, token]);
}
