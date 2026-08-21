import { CoreError } from '../../types';

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

// Fills in whatever the caller did not pass, from the environment.
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
