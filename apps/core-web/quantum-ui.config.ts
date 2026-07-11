import { defineConfig } from '@vritti/quantum-ui';
import { getBusinessUnitCurrency, getUserCurrency } from '@vritti/quantum-ui/currency';
import { parseSlug } from '@vritti/quantum-ui/slug';
import { getBusinessUnitTimeZone, getUserTimeZone } from '@vritti/quantum-ui/timezone';

const WORKSPACE_HEADERS = [
  { prefix: 'bu-', header: 'x-site-id' },
  { prefix: 'sg-', header: 'x-sg-id' },
  { prefix: 'le-', header: 'x-le-id' },
  { prefix: 'org-', header: 'x-org-id' },
] as const;

const getWorkspaceSegment = () => window.location.pathname.split('/').filter(Boolean)[0] ?? null;

// Resolves the active workspace entity id from the URL (bu-/sg-/le-/org- slugs)
const getActiveWorkspaceId = () => {
  const segment = getWorkspaceSegment();
  if (!segment) return null;

  const match = WORKSPACE_HEADERS.find(({ prefix }) => segment.startsWith(prefix));
  if (!match) return null;

  const parsed = parseSlug(segment.slice(match.prefix.length));
  return parsed?.id ?? null;
};

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
      // Exactly one context header per request: bu- → x-site-id, sg- → x-sg-id, le- → x-le-id, org- → x-org-id
      const segment = getWorkspaceSegment();
      if (!segment) return;

      const match = WORKSPACE_HEADERS.find(({ prefix }) => segment.startsWith(prefix));
      if (!match) return;

      const parsed = parseSlug(segment.slice(match.prefix.length));
      if (parsed?.id) config.headers[match.header] = parsed.id;
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
