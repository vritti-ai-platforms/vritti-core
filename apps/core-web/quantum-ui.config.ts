import { defineConfig } from '@vritti/quantum-ui';

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
