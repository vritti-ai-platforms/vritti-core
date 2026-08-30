import { VapError } from '../../core/errors';

/**
 * The variable names a host conventionally reads these from — cloud seals exactly this set into a
 * provisioned website's container when an OAuth app is picked for it.
 *
 * A name map, not a fallback: nothing here reads the environment. It is exported so a host adopting
 * the convention does not retype four strings and let one of them drift.
 */
export const CLOUD_AUTH_ENV = {
  consentUrl: 'VRITTI_OAUTH_CONSENT_URL',
  apiUrl: 'VRITTI_OAUTH_API_URL',
  clientId: 'VRITTI_OAUTH_CLIENT_ID',
  clientSecret: 'VRITTI_OAUTH_CLIENT_SECRET',
} as const;

export interface CloudAuthCredentials {
  consentUrl: string;
  apiUrl: string;
  clientId: string;
  clientSecret?: string;
}

export type CloudAuthCredentialOptions = Partial<CloudAuthCredentials>;

/**
 * Checks the caller supplied what cloud login cannot work without.
 *
 * The host passes these in — the SDK reads no environment variable of its own, for the reasons in
 * `../../config.ts`. Resolved per call rather than once at registration so the failure lands on the
 * login attempt that needs them, not on the admin panel as a whole.
 */
export function resolveCloudAuthCredentials(options: CloudAuthCredentialOptions = {}): CloudAuthCredentials {
  const missing: string[] = [];
  const required = (value: string | undefined, name: string): string => {
    if (!value) {
      missing.push(name);
      return '';
    }
    return value;
  };

  const consentUrl = required(options.consentUrl, 'consentUrl');
  const apiUrl = required(options.apiUrl, 'apiUrl');
  const clientId = required(options.clientId, 'clientId');

  if (missing.length > 0) {
    throw new VapError(
      `Vritti Cloud login is not configured — pass ${missing.join(', ')}.`,
      'Not Configured',
      undefined,
    );
  }

  // Optional on purpose: the consent step is public, so a site that only starts the flow needs no
  // secret. The token exchange is what requires one, and fails there with core's own message.
  return { consentUrl: trimSlash(consentUrl), apiUrl: trimSlash(apiUrl), clientId, clientSecret: options.clientSecret };
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}
