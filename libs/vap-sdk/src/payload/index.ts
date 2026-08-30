export { type ConsoleEmailOptions, consoleEmailAdapter } from './console-email';
export { type OtpChannel, OTP_CHANNELS } from '../core/domains/otp';
// Re-exported from `core` so a Payload app has one import for everything it needs. The phone rules
// are universal — React Native will want the same ones — so they live in the core tier.
export {
  type CountryCode,
  countryFlag,
  DEFAULT_COUNTRY,
  DEFAULT_DIAL_CODE,
  DIALING_COUNTRIES,
  type DialingCountry,
  isValidPhone,
  normalizePhone,
  splitPhone,
  toE164,
} from '../core/phone';
export { reconcileMirroredUsers } from './cloud-auth/accounts';
export { cloudAuthFields } from './cloud-auth/collection';
export { CLOUD_AUTH_ENV, type CloudAuthCredentials } from './cloud-auth/config';
export { CALLBACK_URL_PATH } from './cloud-auth/endpoints';
export { vrittiCloudAuth } from './cloud-auth/plugin';
export type { VrittiCloudAuthOptions } from './cloud-auth/types';
export { customersCollection } from './collections/customers';
export { VAP_CACHE_TABLE, vapCacheCollection } from './collections/vap-cache';
export { type VapOptions, vap } from './plugin';
export {
  createPostgresResponseCache,
  type PostgresResponseCacheOptions,
} from '../server/cache/postgres';
export { type IssuedSession, issueSessionToken } from './session-token';
export { getSdk, type PayloadLike, SDK_CONFIG_KEY, type ShopperLike } from './runtime';
