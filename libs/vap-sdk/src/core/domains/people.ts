import type { ApolloClient } from '@apollo/client';
import { VapError } from '../errors.js';
import {
  ADD_PARTY_ADDRESS,
  ADD_PERSON_COMMUNICATION,
  ADD_TO_WISHLIST,
  CREATE_PERSON,
  PARTY_ADDRESSES_QUERY,
  PARTY_PROFILE_QUERY,
  PEOPLE_BY_COMMUNICATION_QUERY,
  REMOVE_FROM_WISHLIST,
  REMOVE_PARTY_ADDRESS,
  UPDATE_PARTY_ADDRESS,
  UPDATE_PARTY_PROFILE,
  WISHLIST_CODES_QUERY,
  WISHLIST_QUERY,
} from '../graphql/people.js';
import { requireData, run } from '../transport/errors.js';
import { type Money, type RequestContext, withoutWorkspace } from '../types.js';

export const CHANNELS = {
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  WEB_APP: 'WEB_APP',
} as const;

export type Channel = (typeof CHANNELS)[keyof typeof CHANNELS];

export type Person = {
  id: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
};

export type PersonCommunication = {
  id: string;
  channel: Channel;
  value: string;
  isPrimary: boolean;
  isActive: boolean;
};

export type CreatePersonInput = {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

export type PartyAddress = {
  id: string;
  line1: string;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  countryCode: string;
  isDefault: boolean;
};

export type PartyAddressInput = {
  line1: string;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  countryCode: string;
  isDefault?: boolean;
};

export type PartyProfile = {
  id: string;
  displayName: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type PartyProfileInput = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

export type WishlistAddResult = {
  alreadyExists: boolean;
  wishlist: WishlistItem[];
};

export type WishlistItem = {
  id: string;
  catalogListingId: string;
  name: string;
  code: string;
  price: Money | null;
  isAvailable: boolean;
  createdAt: string;
};

export function createPeopleOperations(client: ApolloClient, context: RequestContext = {}, currency?: string) {
  const requestContext = { requestContext: context };
  // A wishlist is the person's across the whole organization, so its calls carry no workspace.
  const wishlistContext = { requestContext: withoutWorkspace(context) };

  // Refused here rather than at core, so a caller that forgot `forContext` gets a message naming the mistake instead of
  // a uniform "sign in" from the far end of a signed request.
  const currencyCode = (): string => {
    if (!currency) {
      throw new VapError(
        'VAP is not configured for prices — pass `currency` (e.g. "INR") to createVapSdk.',
        'Not Configured',
        undefined,
      );
    }
    return currency;
  };

  const requireParty = (): void => {
    if (!context.partyId) {
      throw new VapError('This needs a signed-in party — use sdk.forContext({ partyId }).', 'No Party', 401);
    }
  };

  return {
    // Who is reachable at this email or phone, oldest party first.
    findByCommunication(channel: Channel, value: string): Promise<Person[]> {
      return run(() =>
        client
          .query({
            query: PEOPLE_BY_COMMUNICATION_QUERY,
            variables: { input: { channel, value } },
            context: requestContext,
          })
          .then((r) => requireData(r.data).peopleByCommunication as Person[]),
      );
    },

    // Creates the person plus their primary EMAIL and PHONE rows, in one transaction server-side.
    create(input: CreatePersonInput): Promise<Person> {
      return run(() =>
        client
          .mutate({ mutation: CREATE_PERSON, variables: { input }, context: requestContext })
          .then((r) => requireData(r.data).createPerson as Person),
      );
    },

    // Adds one communication — the `WEB_APP` reference, and the backfilled EMAIL/PHONE.
    addCommunication(personId: string, channel: Channel, value: string): Promise<PersonCommunication> {
      return run(() =>
        client
          .mutate({
            mutation: ADD_PERSON_COMMUNICATION,
            variables: { input: { personId, channel, value } },
            context: requestContext,
          })
          .then((r) => requireData(r.data).addPersonCommunication as PersonCommunication),
      );
    },
    // The signed-in party's own details.
    async profile(): Promise<PartyProfile> {
      requireParty();
      return run(() =>
        client
          .query({ query: PARTY_PROFILE_QUERY, context: wishlistContext })
          .then((r) => requireData(r.data).partyProfile as PartyProfile),
      );
    },
    // Saves a change to those details, and answers the profile as it now stands.
    async updateProfile(input: PartyProfileInput): Promise<PartyProfile> {
      requireParty();
      return run(() =>
        client
          .mutate({ mutation: UPDATE_PARTY_PROFILE, variables: { input }, context: wishlistContext })
          .then((r) => requireData(r.data).updatePartyProfile as PartyProfile),
      );
    },
    // The party's address book.
    async addresses(): Promise<PartyAddress[]> {
      requireParty();
      return run(() =>
        client
          .query({ query: PARTY_ADDRESSES_QUERY, context: wishlistContext })
          .then((r) => requireData(r.data).partyAddresses as PartyAddress[]),
      );
    },
    async addAddress(input: PartyAddressInput): Promise<PartyAddress[]> {
      requireParty();
      return run(() =>
        client
          .mutate({ mutation: ADD_PARTY_ADDRESS, variables: { input }, context: wishlistContext })
          .then((r) => requireData(r.data).addPartyAddress as PartyAddress[]),
      );
    },
    async updateAddress(id: string, input: PartyAddressInput): Promise<PartyAddress[]> {
      requireParty();
      return run(() =>
        client
          .mutate({
            mutation: UPDATE_PARTY_ADDRESS,
            variables: { input: { id, ...input } },
            context: wishlistContext,
          })
          .then((r) => requireData(r.data).updatePartyAddress as PartyAddress[]),
      );
    },
    async removeAddress(id: string): Promise<PartyAddress[]> {
      requireParty();
      return run(() =>
        client
          .mutate({ mutation: REMOVE_PARTY_ADDRESS, variables: { input: { id } }, context: wishlistContext })
          .then((r) => requireData(r.data).removePartyAddress as PartyAddress[]),
      );
    },
    async wishlist(): Promise<WishlistItem[]> {
      requireParty();
      return run(() =>
        client
          .query({
            query: WISHLIST_QUERY,
            variables: { input: { currencyCode: currencyCode() } },
            context: wishlistContext,
          })
          .then((r) => requireData(r.data).wishlist as WishlistItem[]),
      );
    },
    // Which products are saved — codes only, for a product page's "Saved" state.
    async savedCodes(): Promise<string[]> {
      requireParty();
      return run(() =>
        client
          .query({ query: WISHLIST_CODES_QUERY, context: wishlistContext })
          .then((r) => requireData(r.data).wishlistCodes as string[]),
      );
    },
    // Marks a listing.
    async addToWishlist(code: string): Promise<WishlistAddResult> {
      requireParty();
      return run(() =>
        client
          .mutate({
            mutation: ADD_TO_WISHLIST,
            variables: { input: { code, currencyCode: currencyCode() } },
            context: wishlistContext,
          })
          .then((r) => requireData(r.data).addToWishlist as WishlistAddResult),
      );
    },
    async removeFromWishlist(code: string): Promise<WishlistItem[]> {
      requireParty();
      return run(() =>
        client
          .mutate({
            mutation: REMOVE_FROM_WISHLIST,
            variables: { input: { code, currencyCode: currencyCode() } },
            context: wishlistContext,
          })
          .then((r) => requireData(r.data).removeFromWishlist as WishlistItem[]),
      );
    },
  };
}

export type PeopleOperations = ReturnType<typeof createPeopleOperations>;
