import { defineConfig } from '@vritti/quantum-ui';
import { parseSlug } from '@vritti/quantum-ui/slug';

/**
 * quantum-ui configuration for vritti-web-nexus (host app)
 *
 * This file configures quantum-ui's behavior for the host application.
 * Must match the configuration in vritti-auth for consistent behavior.
 */
export default defineConfig({
  /**
   * CSRF Token Configuration
   */
  csrf: {
    endpoint: '/csrf/token',
    enabled: true,
    headerName: 'x-csrf-token',
  },

  /**
   * Axios HTTP Client Configuration
   */
  axios: {
    baseURL: '/api',
    timeout: 30000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    onRequest: (config) => {
      // Extract buId from URL path (e.g. /bu-hq~uuid/items → uuid)
      const buSegment = window.location.pathname.split('/').find((s) => s.startsWith('bu-'));
      if (buSegment) {
        const parsed = parseSlug(buSegment.replace(/^bu-/, ''));
        if (parsed?.id) {
          config.headers['x-bu-id'] = parsed.id;
        }
      }
    },
  },

  /**
   * Authentication Configuration
   * Must match vritti-auth config for session recovery to work
   */
  auth: {
    tokenHeaderName: 'Authorization',
    tokenPrefix: 'Bearer',
    tokenEndpoint: 'auth/access-token',
    refreshEndpoint: 'auth/refresh-tokens',
    sessionRecoveryEnabled: true,
  },

  views: {
    viewsEndpoint: 'table-views',
    statesEndpoint: 'table-states',
  },
});
