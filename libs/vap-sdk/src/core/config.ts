import { VapError } from './errors';
import type { VapSdkConfig } from './types';

/** What a caller may leave out, because it is optional or supplied elsewhere. */
export type VapSdkOptions = Partial<VapSdkConfig>;

/**
 * Checks the caller supplied what the SDK cannot work without.
 *
 * **The SDK reads no environment variables of its own.** A host passes these in the way it passes
 * `databaseUrl` — it is the host that knows which names its deployment uses, and those differ:
 * a cloud-provisioned website is handed `VRITTI_APP_CLIENT_SECRET`, a test harness supplies a
 * throwaway key from nowhere near the environment, a second credential in the same process has no
 * variable at all. A library reaching for `process.env` itself would fix one of those spellings for
 * everybody and put its configuration somewhere the host cannot see.
 *
 * Validated here rather than at construction so the failure lands on the first request that needs
 * core, not on the whole CMS at boot — see the lazy client in `payload/plugin.ts`.
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

  const endpoint = required(options.endpoint, 'endpoint');
  const clientId = required(options.clientId, 'clientId');
  const clientSecret = required(options.clientSecret, 'clientSecret');

  if (missing.length > 0) {
    // A configuration mistake, not a request failure — but it surfaces as VapError so a caller that
    // already handles core failures does not need a second catch for this one.
    throw new VapError(`VAP is not configured — pass ${missing.join(', ')}.`, 'Not Configured', undefined);
  }

  return { ...options, endpoint, clientId, clientSecret };
}
