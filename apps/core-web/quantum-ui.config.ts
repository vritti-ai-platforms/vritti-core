import { defineConfig } from '@vritti/quantum-ui';
import { getBusinessUnitCurrency, getUserCurrency } from '@vritti/quantum-ui/currency';
import { getBusinessUnitTimeZone, getUserTimeZone } from '@vritti/quantum-ui/timezone';
import { getActiveWorkspace, type WorkspaceKind } from './src/utils/workspace';

const WORKSPACE_TRANSPORT: Record<WorkspaceKind, { header: string; param: string }> = {
  site: { header: 'x-site-id', param: 'siteId' },
  group: { header: 'x-sg-id', param: 'sgId' },
  le: { header: 'x-le-id', param: 'leId' },
  org: { header: 'x-org-id', param: 'orgId' },
};

const getActiveWorkspaceId = () => getActiveWorkspace()?.id ?? null;

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
      // Exactly one context header per request: site- → x-site-id, sg- → x-sg-id, le- → x-le-id, org- → x-org-id
      const workspace = getActiveWorkspace();
      if (workspace?.id) config.headers[WORKSPACE_TRANSPORT[workspace.kind].header] = workspace.id;
    },
  },

  /**
   * Server-Sent Events Configuration
   */
  sse: {
    // Same context value axios.onRequest sends as a header, on the query string since EventSource can't set headers
    onRequest: (url) => {
      const workspace = getActiveWorkspace();
      if (!workspace?.id) return url;

      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}${WORKSPACE_TRANSPORT[workspace.kind].param}=${encodeURIComponent(workspace.id)}`;
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

  timeZone: {
    resolveTimeZone: () => {
      const workspaceId = getActiveWorkspaceId();
      if (workspaceId) {
        return getBusinessUnitTimeZone(workspaceId) ?? getUserTimeZone();
      }

      return getUserTimeZone();
    },
  },

  currency: {
    resolveCurrency: () => {
      const workspaceId = getActiveWorkspaceId();
      if (workspaceId) {
        return getBusinessUnitCurrency(workspaceId) ?? getUserCurrency();
      }

      return getUserCurrency();
    },
  },

  views: {
    viewsEndpoint: 'table-views',
    statesEndpoint: 'table-states',
  },
});
