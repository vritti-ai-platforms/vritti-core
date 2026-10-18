import { VapError } from './errors.js';
import type { VapSdkConfig } from './types.js';

export type VapSdkOptions = Partial<VapSdkConfig>;

// Checks the caller supplied what the SDK cannot work without.
export function resolveConfig(options: VapSdkOptions = {}): VapSdkConfig {
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
    // A configuration mistake, not a request failure — but it surfaces as VapError so a caller that already handles
    // core failures does not need a second catch for this one.
    throw new VapError(`VAP is not configured — pass ${missing.join(', ')}.`, 'Not Configured', undefined);
  }

  return { ...options, endpoint, clientId, clientSecret };
}
