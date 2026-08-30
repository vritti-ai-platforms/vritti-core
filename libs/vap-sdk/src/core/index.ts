export { resolveConfig, type VapSdkOptions } from './config';
export {
  CHANNELS,
  type Channel,
  createPeopleOperations,
  type CreatePersonInput,
  type PeopleOperations,
  type Person,
  type PersonCommunication,
} from './domains/people';
export {
  createOtpOperations,
  type OtpChannel,
  OTP_CHANNELS,
  type OtpOperations,
  type SendOtpResult,
  type VerifyOtpResult,
} from './domains/otp';
export { PartyRollbackError, VapError } from './errors';
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
} from './phone';

export {
  type AuthFlows,
  createAuthFlows,
  type LocalRecord,
  type RegisterPersonHooks,
  type RegisterPersonInput,
  type RegisterPersonResult,
} from './flows/auth';
export { createVapClient, type VapClientOptions } from './transport/client';
export { requireData, run } from './transport/errors';
export { CLIENT_ID_HEADER, PARTY_ID_HEADER } from './transport/headers';
export type {
  ResponseCacheContext,
  ResponseCacheStore,
} from './transport/response-cache-store';
export type { RequestContext, VapSdkConfig } from './types';
