import type { AuthStatusResponse } from '@services/user.service';
import { useQueryClient } from '@tanstack/react-query';
import { clearToken, scheduleTokenRefresh, setToken } from '@vritti/quantum-ui/axios';
import { useSSE } from '@vritti/quantum-ui/hooks';
import { useEffect, useRef, useState } from 'react';

type AuthEvents = {
  'auth-state': AuthStatusResponse;
};

// Streams auth status via SSE — replaces one-shot query + handles session-revocation in real time
export function useAuthStatusStream(enabled = true) {
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<AuthStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const wasAuthenticated = useRef(false);

  const { eventType, data, isConnected } = useSSE<AuthEvents>({
    path: '/auth/status',
    events: ['auth-state'],
    enabled,
  });

  useEffect(() => {
    if (!eventType || !data) return;

    if (eventType === 'auth-state') {
      const response = data as AuthStatusResponse;
      setAuthState(response);
      setIsLoading(false);

      if (response.isAuthenticated && response.accessToken && response.expiresIn) {
        wasAuthenticated.current = true;
        setToken(response.accessToken);
        scheduleTokenRefresh(response.expiresIn);
      } else if (!response.isAuthenticated && wasAuthenticated.current) {
        // Mid-session revocation: clear credentials — AppRender switches to publicRoutes automatically
        wasAuthenticated.current = false;
        clearToken();
        queryClient.clear();
      }
      // Initial unauthenticated load: just update state — AppRender shows login page via publicRoutes
    }
  }, [eventType, data, queryClient]);

  return { authResponse: authState, isLoading, isConnected };
}
