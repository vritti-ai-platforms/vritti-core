import { VapError, type VapSdkConfig } from './types';

/**
 * The variables this SDK reads when it is not handed a value.
 *
 * Unprefixed on purpose — the SDK owns these names, so a consumer configures core access by setting
 * them and nothing else. Each has a matching field on `VapSdkConfig`; passing the field wins, which
 * is what lets a test or a second credential bypass the environment entirely.
 */
export const ENV_VARS = {
  endpoint: 'CORE_GRAPHQL_URL',
  clientId: 'APP_CLIENT_ID',
  privateKey: 'APP_PRIVATE_KEY',
} as const;

/** What a caller may leave out, because the environment can supply it. */
export type VapSdkOptions = Partial<VapSdkConfig>;

/**
 * Fills in whatever the caller did not pass, from the environment.
 *
 * Resolution lives here rather than in every consuming app: reading three variables and producing a
 * useful message when one is missing was duplicated work, and the SDK is what knows which of them are
 * required and what each is for.
 *
 * Read through `globalThis` rather than `process.env` directly, so importing this in a browser bundle
 * yields a missing-configuration error instead of `ReferenceError: process is not defined` — the SDK's
 * documents are meant to be reusable from a UI even though its signing is not.
 */
export function resolveConfig(options: VapSdkOptions = {}): VapSdkConfig {
  // Collected rather than thrown one at a time, so someone configuring this for the first time is told
  // about all three at once instead of discovering them across three failed deploys.
  const missing: string[] = [];
  const required = (value: string | undefined, name: string): string => {
    if (!value) {
      missing.push(name);
      return '';
    }
    return value;
  };

  const endpoint = required(options.endpoint ?? readEnv(ENV_VARS.endpoint), ENV_VARS.endpoint);
  const clientId = required(options.clientId ?? readEnv(ENV_VARS.clientId), ENV_VARS.clientId);
  const privateKey = required(options.privateKey ?? readEnv(ENV_VARS.privateKey), ENV_VARS.privateKey);

  if (missing.length > 0) {
    // A configuration mistake, not a request failure — but it surfaces as VapError so a caller that
    // already handles core failures does not need a second catch for this one.
    throw new VapError(`VAP is not configured — set ${missing.join(', ')}.`, 'Not Configured', undefined);
  }

  return { ...options, endpoint, clientId, privateKey };
}

function readEnv(name: string): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.[name]?.trim() || undefined;
}
