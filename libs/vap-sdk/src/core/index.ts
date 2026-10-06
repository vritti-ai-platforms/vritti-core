export { resolveConfig, type VapSdkOptions } from './config';
export {
  type Cart,
  type CartItem,
  type CartOperations,
  type CartQuantity,
  createCartOperations,
} from './domains/cart';
export {
  type CatalogChannelsOperations,
  type CatalogListing,
  type CatalogListings,
  createCatalogChannelsOperations,
  type FilterKind,
  type ListingFilter,
  type ListingFilterSelection,
  type ListingQuery,
  type ListingSort,
} from './domains/catalog-channels';
export {
  createOfferingsOperations,
  type OfferingsOperations,
  type OfferingVariantOption,
  type OfferingVariantOptions,
} from './domains/offerings';
export {
  CHANNELS,
  type Channel,
  type CreatePersonInput,
  createPeopleOperations,
  type PartyAddress,
  type PartyAddressInput,
  type PartyProfile,
  type PartyProfileInput,
  type PeopleOperations,
  type Person,
  type PersonCommunication,
  type WishlistAddResult,
  type WishlistItem,
} from './domains/people';
export { createSmsOtpOperations, type SmsOtpOperations } from './domains/sms-otp';
export {
  createWhatsappOtpOperations,
  type WhatsappOtpOperations,
} from './domains/whatsapp-otp';
export { PartyRollbackError, VapError } from './errors';
export {
  type AuthFlows,
  createAuthFlows,
  type LocalRecord,
  type OtpFlowData,
  type OtpMessages,
  type OtpOutcome,
  type OtpStep,
  type RegisterPersonHooks,
  type RegisterPersonInput,
  type RegisterPersonResult,
  safeReturnTo,
  stepFromFlow,
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
export type {
  Money,
  OtpChannel,
  RequestContext,
  SendOtpResult,
  VapSdkConfig,
  WorkspaceScope,
} from './types';
export { OTP_CHANNELS } from './types';
