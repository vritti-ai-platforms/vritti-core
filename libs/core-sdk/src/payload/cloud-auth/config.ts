import { CoreError } from '../../types';

/**
 * The variables the platform seals into a website's container when an OAuth app is selected for it.
 *
 * Names are fixed on both sides — cloud's desired-state builder writes exactly these, so a provisioned site
 * is configured by choosing an app in the cloud UI and nothing else. Passing an option here wins, which is
 * what lets a local checkout point at a dev cloud without touching its environment.
 */
export const CLOUD_AUTH_ENV = {
  consentUrl: 'VRITTI_OAUTH_CONSENT_URL',
  apiUrl: 'VRITTI_OAUTH_API_URL',
  clientId: 'VRITTI_OAUTH_CLIENT_ID',
  clientSecret: 'VRITTI_OAUTH_CLIENT_SECRET',
} as const;

export interface CloudAuthCredentials {
  /** cloud-web's origin — where a member is sent to approve this app */
  consentUrl: string;
  /** cloud-server's origin — the token, userinfo and member-status back channel */
  apiUrl: string;
  clientId: string;
  /** Absent for a public client, which authenticates with PKCE alone */
  clientSecret?: string;
}

export type CloudAuthCredentialOptions = Partial<CloudAuthCredentials>;

/**
 * Fills in whatever the caller did not pass, from the environment.
 *
 * Resolved per request rather than at config time, deliberately: a missing variable then fails the sign-in
 * that needs it instead of the whole CMS at boot, so a site whose Vritti login is not configured still
 * serves its storefront and its admin panel.
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

  const consentUrl = required(options.consentUrl ?? readEnv(CLOUD_AUTH_ENV.consentUrl), CLOUD_AUTH_ENV.consentUrl);
  const apiUrl = required(options.apiUrl ?? readEnv(CLOUD_AUTH_ENV.apiUrl), CLOUD_AUTH_ENV.apiUrl);
  const clientId = required(options.clientId ?? readEnv(CLOUD_AUTH_ENV.clientId), CLOUD_AUTH_ENV.clientId);
  const clientSecret = options.clientSecret ?? readEnv(CLOUD_AUTH_ENV.clientSecret);

  if (missing.length > 0) {
    throw new CoreError(
      `Vritti Cloud login is not configured — set ${missing.join(', ')}.`,
      'Not Configured',
      undefined,
    );
  }

  return { consentUrl: trimSlash(consentUrl), apiUrl: trimSlash(apiUrl), clientId, clientSecret };
}

function readEnv(name: string): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.[name]?.trim() || undefined;
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}
