import type { AuthStatusResponse } from '@services/user.service';
import { useQueryClient } from '@tanstack/react-query';
import { clearToken, scheduleTokenRefresh, setToken } from '@vritti/quantum-ui/axios';
import { setOrgCountryCode } from '@vritti/quantum-ui/country';
import { setWorkspaceCurrency } from '@vritti/quantum-ui/currency';
import { useSSE } from '@vritti/quantum-ui/hooks';
import { setWorkspaceTimeZone } from '@vritti/quantum-ui/timezone';
import { useEffect, useRef, useState } from 'react';

type AuthEvents = {
  'auth-state': AuthStatusResponse;
};

// Records the org's country and every workspace's currency and timezone before the payload renders a workspace screen;
// a site prices in its legal entity's currency, and the org and its site groups in the org default
function recordWorkspaceSettings({ org, sites = [], legalEntities = [], siteGroups = [] }: AuthStatusResponse) {
  for (const site of sites) {
    setWorkspaceTimeZone(site.id, site.timezone);
    setWorkspaceCurrency(site.id, site.currencyCode);
  }
  for (const le of legalEntities) {
    setWorkspaceCurrency(le.id, le.currencyCode);
  }
  if (!org) return;
  setOrgCountryCode(org.countryCode);
  setWorkspaceCurrency(org.id, org.defaultCurrencyCode);
  for (const group of siteGroups) {
    setWorkspaceCurrency(group.id, org.defaultCurrencyCode);
  }
}

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
      if (response.isAuthenticated) recordWorkspaceSettings(response);
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
