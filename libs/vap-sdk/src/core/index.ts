export { resolveConfig, type VapSdkOptions } from './config';
export { type CatalogListing, type CatalogOperations, createCatalogOperations } from './domains/catalog';
export {
  createOtpOperations,
  OTP_CHANNELS,
  type OtpChannel,
  type OtpOperations,
  type SendOtpResult,
  type VerifyOtpResult,
} from './domains/otp';
export {
  CHANNELS,
  type Channel,
  type CreatePersonInput,
  createPeopleOperations,
  type PeopleOperations,
  type Person,
  type PersonCommunication,
} from './domains/people';
export {
  type Cart,
  type CartItem,
  type CartQuantity,
  createShopperOperations,
  type Money,
  type ShopperAddress,
  type ShopperAddressInput,
  type ShopperOperations,
  type ShopperProfile,
  type ShopperProfileInput,
  type WishlistAddResult,
  type WishlistItem,
} from './domains/shopper';
export { PartyRollbackError, VapError } from './errors';
export {
  type AuthFlows,
  createAuthFlows,
  type LocalRecord,
  type RegisterPersonHooks,
  type RegisterPersonInput,
  type RegisterPersonResult,
} from './flows/auth';
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
export { createVapClient, type VapClientOptions } from './transport/client';
export { requireData, run } from './transport/errors';
export { CLIENT_ID_HEADER, PARTY_ID_HEADER } from './transport/headers';
export type {
  ResponseCacheContext,
  ResponseCacheStore,
} from './transport/response-cache-store';
export type { RequestContext, VapSdkConfig, WorkspaceScope } from './types';
